import { classOf, loadStyle, scrollOffsetAt, scrollThumb, type ComponentStyle, type ScrollThumb } from '@vitral/core';
import type { Props } from './h';

/**
 * Whether drawn bars wait for the pointer (`'hover'`: shown while the pointer
 * is over the box, focus is inside it, or it is being scrolled) or stay on the
 * screen (`'always'`).
 */
export type ScrollbarVisibility = 'hover' | 'always';

/** The parts the bars are made of, and the state each one is dressed for. */
export type ScrollbarPart = 'bars' | 'bar' | 'thumb';

export interface ScrollbarPartState {
    /** On `bars`: the visibility asked for, and whether the bars are showing now. */
    visibility?: ScrollbarVisibility;
    shown?: boolean;
    /** On `bar` and `thumb`: the axis, and whether its thumb is being dragged. */
    axis?: 'x' | 'y';
    active?: boolean;
}

export interface ScrollbarsOptions {
    /** `'hover'` by default. */
    visibility?: ScrollbarVisibility;
    /**
     * The attributes of each part (its classes above all), which is how the
     * bars wear a theme: `partResolver({ style: scrollpanelStyle, … })` gives
     * them the ScrollPanel's.
     */
    part?: (name: ScrollbarPart, state: ScrollbarPartState) => Props;
}

export interface Scrollbars {
    /** Measures again: the box, its content, and where the bars sit. */
    refresh(): void;
    update(options: ScrollbarsOptions): void;
    /** Takes the bars away and gives the box its own scrolling look back. */
    destroy(): void;
}

/** Marks a box whose native bars are hidden, because drawn ones stand in for them. */
export const SCROLLBARS_ATTRIBUTE = 'data-vt-scrollbars';

function dress(el: HTMLElement, attrs: Props) {
    const cls = attrs.class;
    const value = typeof cls === 'string' ? cls : Array.isArray(cls) ? cls.filter(Boolean).join(' ') : '';
    if (el.className !== value) el.className = value;
    for (const [key, val] of Object.entries(attrs)) {
        if (key === 'class' || key === 'style' || key.startsWith('on') || typeof val === 'function' || typeof val === 'object') continue;
        if (val === undefined || val === null || val === false) el.removeAttribute(key);
        else el.setAttribute(key, String(val));
    }
}

const frame = (fn: () => void): number => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(fn) : (setTimeout(fn, 16) as unknown as number));
const cancelFrame = (id: number) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id));

/**
 * Draws the theme's scrollbars over a box that already scrolls, without
 * moving it or anything in it: the box keeps native scrolling (wheel, touch,
 * keys, `scrollIntoView`), its native bars are hidden, and the drawn ones are
 * laid in a layer placed right after it, over its visible area.
 *
 * The bars follow the box and what is inside it: they are measured again when
 * the box changes size, when anything in it does (an image that loads, a
 * section that opens with an animation), when its children change, and when
 * it scrolls. The track lets presses through to the content under it, so only
 * the thumb is a target. The bars are for the pointer and are hidden from
 * assistive technology, which hears the box itself.
 */
export function scrollbars(el: HTMLElement, initial: ScrollbarsOptions = {}): Scrollbars {
    let options = initial;
    const doc = el.ownerDocument;
    const layer = doc.createElement('div');
    layer.setAttribute('aria-hidden', 'true');
    layer.style.position = 'absolute';
    layer.style.top = '0px';
    layer.style.left = '0px';
    layer.style.pointerEvents = 'none';

    const bars = {
        y: { bar: doc.createElement('div'), thumb: doc.createElement('div'), state: { visible: false, size: 0, position: 0 } as ScrollThumb },
        x: { bar: doc.createElement('div'), thumb: doc.createElement('div'), state: { visible: false, size: 0, position: 0 } as ScrollThumb }
    };
    for (const axis of ['y', 'x'] as const) {
        const { bar, thumb } = bars[axis];
        bar.style.display = 'none';
        thumb.style.pointerEvents = 'auto';
        bar.appendChild(thumb);
        layer.appendChild(bar);
        thumb.addEventListener('pointerdown', (event) => grab(axis, event));
    }

    let hovered = false;
    let focused = false;
    let scrolling = false;
    let dragging: 'x' | 'y' | null = null;
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    let pending = 0;
    let top = 0;
    let left = 0;
    let rtl = false;
    let inside = false;

    function dressAll() {
        const part = options.part;
        const visibility = options.visibility ?? 'hover';
        const shown = visibility === 'always' || hovered || focused || scrolling || dragging !== null;
        if (part) {
            dress(layer, part('bars', { visibility, shown }));
            for (const axis of ['y', 'x'] as const) {
                dress(bars[axis].bar, part('bar', { axis, active: dragging === axis }));
                dress(bars[axis].thumb, part('thumb', { axis, active: dragging === axis }));
            }
        }
        layer.style.position = 'absolute';
        layer.style.pointerEvents = 'none';
    }

    function place() {
        if (!el.isConnected) return;
        const style = typeof getComputedStyle === 'function' ? getComputedStyle(el) : null;
        rtl = style?.direction === 'rtl';
        // A positioned box (a popup, above all) holds the layer itself, which is
        // then part of it to whatever asks what is inside — a press on the thumb
        // is not a press outside the popup. The layer is carried along as the
        // box scrolls, so it stays over the visible area. Never in a text editor's
        // box (`contenteditable`, true or false), where it would become text.
        inside = !!style && style.position !== 'static' && !el.closest('[contenteditable]');
        if (inside) {
            if (layer.parentNode !== el) {
                el.appendChild(layer);
                follow();
            }
            layer.style.zIndex = '';
            hold();
            return;
        }
        if (layer.parentNode !== el.parentNode || layer.previousSibling !== el) {
            el.after(layer);
            if (typeof getComputedStyle === 'function') follow();
        }
        const box = el.getBoundingClientRect();
        const self = layer.getBoundingClientRect();
        const nextTop = top + (box.top + el.clientTop - self.top);
        const nextLeft = left + (box.left + el.clientLeft - self.left);
        if (Number.isFinite(nextTop) && Math.abs(nextTop - top) > 0.1) top = nextTop;
        if (Number.isFinite(nextLeft) && Math.abs(nextLeft - left) > 0.1) left = nextLeft;
        layer.style.top = `${top}px`;
        layer.style.left = `${left}px`;
        layer.style.width = `${el.clientWidth}px`;
        layer.style.height = `${el.clientHeight}px`;
    }

    /** Inside the box: over its visible area, wherever it has scrolled to. */
    function hold() {
        layer.style.top = `${el.scrollTop}px`;
        layer.style.left = `${el.scrollLeft}px`;
        layer.style.width = `${el.clientWidth}px`;
        layer.style.height = `${el.clientHeight}px`;
    }

    /** The thumbs, from the box's scroll state: cheap enough for every scroll event. */
    function thumbs() {
        const y = bars.y;
        y.state = scrollThumb({ viewport: el.clientHeight, content: el.scrollHeight, offset: el.scrollTop, track: y.bar.clientHeight || undefined });
        y.bar.style.display = y.state.visible ? '' : 'none';
        if (y.state.visible) {
            y.state = scrollThumb({ viewport: el.clientHeight, content: el.scrollHeight, offset: el.scrollTop, track: y.bar.clientHeight || el.clientHeight });
            y.thumb.style.height = `${y.state.size}px`;
            y.thumb.style.transform = `translateY(${y.state.position}px)`;
        }
        const x = bars.x;
        const offset = Math.abs(el.scrollLeft);
        x.state = scrollThumb({ viewport: el.clientWidth, content: el.scrollWidth, offset });
        x.bar.style.display = x.state.visible ? '' : 'none';
        if (x.state.visible) {
            const track = x.bar.clientWidth || el.clientWidth;
            x.state = scrollThumb({ viewport: el.clientWidth, content: el.scrollWidth, offset, track });
            const at = rtl ? track - x.state.size - x.state.position : x.state.position;
            x.thumb.style.width = `${x.state.size}px`;
            x.thumb.style.transform = `translateX(${at}px)`;
        }
    }

    function refresh() {
        if (pending) cancelFrame(pending);
        pending = 0;
        dressAll();
        place();
        thumbs();
    }

    function schedule() {
        if (!pending) pending = frame(refresh);
    }

    // ---- what is watched ------------------------------------------------------------

    // Sizes are read after layout, so the bars can follow in the same frame.
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(() => refresh()) : null;
    const watched = new Set<Element>();
    let chain: Element[] = el.parentElement ? [el.parentElement] : [];
    function watchChildren() {
        if (!resize) return;
        // Each child's size, so content that grows inside the box is seen; a
        // long list is left to the mutations and the loads below instead.
        const children = el.children.length <= 64 ? Array.from(el.children).filter((child) => child !== layer) : [];
        // And every box between this one and the one the layer is placed in:
        // the box moves when any of them changes size, without changing its own.
        const now = new Set<Element>([el, ...children, ...chain]);
        for (const node of watched) if (!now.has(node)) resize.unobserve(node);
        for (const node of now) if (!watched.has(node)) resize.observe(node, { box: 'border-box' });
        watched.clear();
        for (const node of now) watched.add(node);
    }
    const mutations =
        typeof MutationObserver === 'function'
            ? new MutationObserver(() => {
                  watchChildren();
                  schedule();
              })
            : null;

    function onScroll() {
        if (inside) hold();
        thumbs();
        if ((options.visibility ?? 'hover') === 'hover') {
            if (!scrolling) {
                scrolling = true;
                dressAll();
            }
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                scrolling = false;
                dressAll();
            }, 900);
        }
    }
    const onEnter = () => {
        hovered = true;
        // Something may have moved without changing size; the pointer arriving is a cheap moment to look.
        refresh();
    };
    const onLeave = (event: PointerEvent) => {
        const to = event.relatedTarget as Node | null;
        if (to && (el.contains(to) || layer.contains(to))) return;
        hovered = false;
        dressAll();
    };
    const onFocusIn = () => {
        focused = true;
        dressAll();
    };
    const onFocusOut = (event: FocusEvent) => {
        if (event.relatedTarget && el.contains(event.relatedTarget as Node)) return;
        focused = false;
        dressAll();
    };
    // A layer whose containing block is outside a scrolling ancestor would stay
    // behind when that ancestor scrolls; then the page's scrolling is followed too.
    const onOuterScroll = (event: Event) => {
        if (event.target === el || !(event.target instanceof Node) || !event.target.contains(el)) return;
        schedule();
    };
    let following = false;
    function follow() {
        const holder = inside ? null : layer.offsetParent;
        let needed = false;
        chain = [];
        for (let node = inside ? null : el.parentElement; node && node !== holder; node = node.parentElement) {
            chain.push(node);
            const style = getComputedStyle(node);
            if (/(auto|scroll|hidden)/.test(style.overflowX + style.overflowY) && node !== doc.body && node !== doc.documentElement) needed = true;
        }
        if (holder) chain.push(holder);
        else if (inside && el.parentElement) chain.push(el.parentElement);
        watchChildren();
        if (needed === following) return;
        following = needed;
        if (needed) doc.addEventListener('scroll', onOuterScroll, { capture: true, passive: true });
        else doc.removeEventListener('scroll', onOuterScroll, { capture: true });
    }
    const view = doc.defaultView;

    el.setAttribute(SCROLLBARS_ATTRIBUTE, '');
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    layer.addEventListener('pointerenter', onEnter);
    layer.addEventListener('pointerleave', onLeave);
    el.addEventListener('focusin', onFocusIn);
    el.addEventListener('focusout', onFocusOut);
    // A box that slides or grows into place moves without changing size.
    el.addEventListener('transitionend', schedule);
    // An image or a video inside that finishes loading: `load` does not bubble, but it can be caught.
    el.addEventListener('load', schedule, true);
    el.addEventListener('animationend', schedule);
    view?.addEventListener('resize', schedule);
    mutations?.observe(el, { childList: true, subtree: true, characterData: true });
    watchChildren();
    refresh();

    // ---- dragging the thumb -----------------------------------------------------------

    let grabbedAt = 0;
    function grab(axis: 'x' | 'y', event: PointerEvent) {
        if (event.button > 0) return;
        event.preventDefault();
        event.stopPropagation();
        dragging = axis;
        const state = bars[axis].state;
        // In a right-to-left box the thumb starts at the right and is measured from there.
        if (axis === 'y') grabbedAt = event.clientY - state.position;
        else grabbedAt = rtl ? -event.clientX - state.position : event.clientX - state.position;
        doc.addEventListener('pointermove', move);
        doc.addEventListener('pointerup', release);
        doc.addEventListener('pointercancel', release);
        dressAll();
    }

    function move(event: PointerEvent) {
        if (dragging === 'y') {
            const track = bars.y.bar.clientHeight || el.clientHeight;
            el.scrollTop = scrollOffsetAt(event.clientY - grabbedAt, bars.y.state.size, { viewport: el.clientHeight, content: el.scrollHeight, track });
        } else if (dragging === 'x') {
            const track = bars.x.bar.clientWidth || el.clientWidth;
            const position = rtl ? -event.clientX - grabbedAt : event.clientX - grabbedAt;
            const offset = scrollOffsetAt(position, bars.x.state.size, { viewport: el.clientWidth, content: el.scrollWidth, track });
            el.scrollLeft = rtl ? -offset : offset;
        }
        thumbs();
    }

    function release() {
        dragging = null;
        doc.removeEventListener('pointermove', move);
        doc.removeEventListener('pointerup', release);
        doc.removeEventListener('pointercancel', release);
        dressAll();
    }

    return {
        refresh,
        update(next) {
            options = { ...options, ...next };
            refresh();
        },
        destroy() {
            release();
            if (pending) cancelFrame(pending);
            clearTimeout(scrollTimer);
            resize?.disconnect();
            mutations?.disconnect();
            el.removeAttribute(SCROLLBARS_ATTRIBUTE);
            el.removeEventListener('scroll', onScroll);
            el.removeEventListener('pointerenter', onEnter);
            el.removeEventListener('pointerleave', onLeave);
            el.removeEventListener('focusin', onFocusIn);
            el.removeEventListener('focusout', onFocusOut);
            el.removeEventListener('transitionend', schedule);
            el.removeEventListener('load', schedule, true);
            el.removeEventListener('animationend', schedule);
            view?.removeEventListener('resize', schedule);
            doc.removeEventListener('scroll', onOuterScroll, { capture: true });
            layer.remove();
        }
    };
}

/** The drawn bars, waiting for the pointer or always shown, or the browser's own (`'native'`). */
export type ScrollbarMode = ScrollbarVisibility | 'native';

export interface ScrollbarSlotOptions {
    /** `'hover'` by default. */
    mode?: ScrollbarMode;
    /**
     * The style the bars wear — `scrollpanelStyle`, so one theme dresses
     * every bar. Its stylesheet is loaded when the bars first show, unless
     * `unstyled`.
     */
    style?: ComponentStyle;
    unstyled?: boolean;
    nonce?: string;
    cssLayer?: string | false;
    /** The parts' attributes, in place of the style's classes. */
    part?: ScrollbarsOptions['part'];
}

function slotPart(next: ScrollbarSlotOptions): ScrollbarsOptions['part'] {
    const style = next.style;
    if (style && !next.unstyled) loadStyle(style.name, style.css, { nonce: next.nonce, cssLayer: next.cssLayer });
    return next.part ?? (style && !next.unstyled ? (name: ScrollbarPart, state: ScrollbarPartState) => ({ class: classOf(style, name, state) || undefined }) : undefined);
}

/**
 * Drawn bars on a changing set of boxes, for a renderer that redraws: hand
 * `sync()` the boxes that scroll after each draw. A box keeps its bars across
 * draws, a new one gets them, and one no longer handed over loses them, as do
 * all when the mode turns `'native'`.
 */
export function scrollbarSet(options: () => ScrollbarSlotOptions) {
    const live = new Map<HTMLElement, Scrollbars>();
    let mode: ScrollbarMode | undefined;

    function destroy() {
        for (const bars of live.values()) bars.destroy();
        live.clear();
        mode = undefined;
    }

    return {
        sync(elements: Iterable<Element | null | undefined>) {
            const next = options();
            const chosen = next.mode ?? 'hover';
            if (chosen === 'native') return destroy();
            const wanted = new Set<HTMLElement>();
            for (const el of elements) if (el && el.isConnected) wanted.add(el as HTMLElement);
            for (const [el, bars] of live) {
                if (wanted.has(el)) continue;
                bars.destroy();
                live.delete(el);
            }
            if (!wanted.size) return;
            const part = slotPart(next);
            for (const el of wanted) {
                const bars = live.get(el);
                if (!bars) live.set(el, scrollbars(el, { visibility: chosen, part }));
                else if (chosen !== mode) bars.update({ visibility: chosen, part });
            }
            mode = chosen;
        },
        refresh() {
            for (const bars of live.values()) bars.refresh();
        },
        destroy
    };
}

/**
 * Drawn bars on one box, for a renderer that redraws: put `ref` on the box
 * that scrolls and call `sync()` after each draw. The bars stay on the same
 * box across draws, move to a new one when the box is replaced, and go when
 * it is gone or the mode turns `'native'`.
 */
export function scrollbarSlot(options: () => ScrollbarSlotOptions) {
    const set = scrollbarSet(options);
    let wanted: Element | null = null;
    return {
        ref(node: Element | null) {
            wanted = node;
        },
        sync() {
            set.sync([wanted]);
            wanted = null;
        },
        refresh: set.refresh,
        destroy: set.destroy
    };
}

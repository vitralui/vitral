import { isClient } from '../utils/dom';
import { ZIndex } from '../utils/zindex';
import { anchorTo, type Placement } from './position';
import { overlayContainerOf } from './scope';

export interface TooltipOptions {
    text?: string | null;
    placement?: Placement;
    /** Milliseconds between the pointer (or focus) arriving and the tooltip showing. */
    showDelay?: number;
    /** Milliseconds between the pointer leaving and the tooltip going. */
    hideDelay?: number;
    disabled?: boolean;
    /** Gap to the host, in pixels. */
    offset?: number;
    /** The stacking base; tooltips opened later still go on top. */
    zIndex?: number;
    /** Attributes for the tooltip element and its text — the classes from the style's class map, pass-through. */
    rootAttrs?: Record<string, string | undefined>;
    textAttrs?: Record<string, string | undefined>;
}

export interface TooltipHandle {
    update(options: TooltipOptions): void;
    show(): void;
    hide(): void;
    destroy(): void;
    readonly id: string;
    readonly element: HTMLElement | null;
    readonly visible: boolean;
}

/** Time allowed to cross the gap from the host to the tooltip before it goes (WCAG 1.4.13: hoverable). */
const HOVER_GRACE = 100;
let counter = 0;

function focusVisible(el: Element): boolean {
    try {
        return el.matches(':focus-visible');
    } catch {
        return true;
    }
}

function setAttrs(el: HTMLElement, attrs: Record<string, string | undefined> | undefined, previous: Record<string, string | undefined> | undefined): void {
    for (const key of Object.keys(previous ?? {})) if (!attrs || !(key in attrs)) el.removeAttribute(key);
    for (const [key, value] of Object.entries(attrs ?? {})) {
        if (value === undefined || value === '') el.removeAttribute(key);
        else el.setAttribute(key, value);
    }
}

/**
 * A tooltip for `host`: plain DOM at the end of `<body>` (or of the host's
 * overlay scope — see `overlayContainerOf`), so it works the same
 * under any framework. It shows on hover and on keyboard focus and hides on
 * leave, blur, a press on the host and Escape (WCAG 1.4.13: dismissable,
 * hoverable, persistent). While shown it is `role="tooltip"` and the host's
 * `aria-describedby` names it.
 */
export function createTooltip(host: HTMLElement, initial: TooltipOptions = {}): TooltipHandle {
    let options: TooltipOptions = { placement: 'top', showDelay: 0, hideDelay: 0, offset: 6, ...initial };
    const id = `vt-tooltip-${++counter}`;
    let el: HTMLElement | null = null;
    let textEl: HTMLElement | null = null;
    let release: (() => void) | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pointerInside = false;

    const enabled = () => !options.disabled && !!options.text;

    const clearTimer = () => {
        if (timer !== undefined) clearTimeout(timer);
        timer = undefined;
    };

    const later = (fn: () => void, delay = 0) => {
        clearTimer();
        if (delay > 0) timer = setTimeout(fn, delay);
        else fn();
    };

    function describe(on: boolean) {
        const ids = (host.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((token) => token && token !== id);
        if (on) ids.push(id);
        if (ids.length) host.setAttribute('aria-describedby', ids.join(' '));
        else host.removeAttribute('aria-describedby');
    }

    function paint(previous?: TooltipOptions) {
        if (!el || !textEl) return;
        setAttrs(el, options.rootAttrs, previous?.rootAttrs);
        setAttrs(textEl, options.textAttrs, previous?.textAttrs);
        el.setAttribute('role', 'tooltip');
        el.id = id;
        textEl.textContent = options.text ?? '';
    }

    function place() {
        release?.();
        release = el ? anchorTo(host, el, { placement: options.placement, offset: options.offset }) : null;
    }

    function show() {
        clearTimer();
        if (!isClient || !enabled() || el) return;
        el = document.createElement('div');
        textEl = document.createElement('div');
        el.appendChild(textEl);
        paint();
        el.addEventListener('mouseenter', onTipEnter);
        el.addEventListener('mouseleave', onLeave);
        (overlayContainerOf(host) ?? document.body).appendChild(el);
        place();
        ZIndex.set('tooltip', el, options.zIndex ?? 1100);
        describe(true);
        document.addEventListener('keydown', onDocumentKeydown, true);
    }

    function hide() {
        clearTimer();
        if (!el) return;
        release?.();
        release = null;
        ZIndex.clear(el);
        el.remove();
        el = null;
        textEl = null;
        describe(false);
        document.removeEventListener('keydown', onDocumentKeydown, true);
    }

    function onEnter() {
        pointerInside = true;
        later(show, options.showDelay);
    }

    function onLeave() {
        pointerInside = false;
        if (el) later(hide, Math.max(options.hideDelay ?? 0, HOVER_GRACE));
        else clearTimer();
    }

    function onTipEnter() {
        pointerInside = true;
        clearTimer();
    }

    function onFocusIn() {
        if (focusVisible(host.matches(':focus') ? host : ((document.activeElement as Element | null) ?? host))) later(show, options.showDelay);
    }

    function onFocusOut() {
        if (!pointerInside) hide();
    }

    function onPointerDown() {
        pointerInside = false;
        hide();
    }

    // Escape dismisses the tooltip and nothing else: the key is spent, so a
    // dialog underneath stays open until a second press.
    function onDocumentKeydown(event: KeyboardEvent) {
        if (event.key !== 'Escape' || !el) return;
        event.stopPropagation();
        hide();
    }

    host.addEventListener('mouseenter', onEnter);
    host.addEventListener('mouseleave', onLeave);
    host.addEventListener('focusin', onFocusIn);
    host.addEventListener('focusout', onFocusOut);
    host.addEventListener('pointerdown', onPointerDown);

    return {
        id,
        get element() {
            return el;
        },
        get visible() {
            return el !== null;
        },
        show,
        hide,
        update(next) {
            const previous = options;
            options = { ...options, ...next };
            if (!el) return;
            if (!enabled()) return hide();
            paint(previous);
            if (previous.placement !== options.placement || previous.offset !== options.offset) place();
        },
        destroy() {
            hide();
            host.removeEventListener('mouseenter', onEnter);
            host.removeEventListener('mouseleave', onLeave);
            host.removeEventListener('focusin', onFocusIn);
            host.removeEventListener('focusout', onFocusOut);
            host.removeEventListener('pointerdown', onPointerDown);
        }
    };
}

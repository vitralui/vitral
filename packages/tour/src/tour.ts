import { anchorTo, en, isClient, loadStyle, overlayContainerOf, pushLayer, ZIndex, type Locale, type Placement } from '@vitral/core';
import { createRoot, partResolver } from '@vitral/dom';
import { baseStyle, tourStyle } from '@vitral/styles';
import {
    buttonsOf,
    nextShownIndex,
    optionOf,
    overlayPath,
    placementOf,
    positionOf,
    readProgress,
    stageOf,
    stepIndexOf,
    tweenRect,
    type TourRect
} from './engine/state';
import type { TourConfig, TourElement, TourElementHook, TourEndReason, TourHookOptions, TourPopoverDom, TourState, TourStep, TourStepContext } from './engine/types';
import { tourView } from './render/popover';

/**
 * A guided tour with no framework in it: a highlight and a popover a step,
 * driven by its buttons, the keyboard, or the methods of the handle.
 *
 * The page is dimmed by one SVG path with the element's box cut out of it.
 * The hole is not painted, so it is not there for the pointer either: a press
 * on the element reaches it, and a press on the dimmed page is the overlay's.
 * The popover is a dialog named by its title and described by its text, and
 * it takes the keyboard when a step is shown, so a screen reader reads each
 * step as it arrives; Escape and the arrow keys drive the tour, the arrows
 * the right way round in a right-to-left page.
 *
 * Steps can be shown only `when` something holds, with a `beforeShow`
 * that is waited for, with elements waited for until they appear; steps
 * move on by themselves when the reader does what they ask, progress as
 * text, dots or a bar, the tour remembers where the reader got to, and the
 * words come from the locale and the look from the theme.
 */

export interface TourHandle {
    isActive(): boolean;
    /** Measures the element again and redraws: after a layout change the tour cannot see. */
    refresh(): void;
    /** Starts the tour at a step (its index or its `id`); with none, where the reader left off, or the first. */
    drive(step?: number | string): Promise<void>;
    /** Replaces the configuration. */
    setConfig(config: TourConfig): void;
    setSteps(steps: TourStep[]): void;
    getConfig(): TourConfig;
    getState(): TourState;
    getState<K extends keyof TourState>(key: K): TourState[K];
    getActiveIndex(): number | undefined;
    isFirstStep(): boolean;
    isLastStep(): boolean;
    getActiveStep(): TourStep | undefined;
    getActiveElement(): Element | undefined;
    getPreviousElement(): Element | undefined;
    getPreviousStep(): TourStep | undefined;
    moveNext(): Promise<void>;
    movePrevious(): Promise<void>;
    moveTo(step: number | string): Promise<void>;
    hasNextStep(): boolean;
    hasPreviousStep(): boolean;
    /** Shows one step on its own, outside the tour's steps. */
    highlight(step: TourStep): Promise<void>;
    /** Ends the tour at once; `onDestroyStarted` is not asked. */
    destroy(): void;

    // ---- beyond the steps
    /** Merges into the configuration, and redraws the step on show. */
    update(next: Partial<TourConfig>): void;
    setLocale(locale: Locale): void;
    /** Whether the reader finished the tour, by `storageKey`. */
    isCompleted(): boolean;
    /** Forgets where the reader got to. */
    reset(): void;
}

let counter = 0;

const reducedMotion = () => isClient && typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const isEditable = (target: EventTarget | null) =>
    target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

function findElement(element: TourElement): Element | null {
    if (!element || !isClient) return null;
    if (typeof element === 'string') return document.querySelector(element);
    return rootOf(typeof element === 'function' ? element() : element);
}

/**
 * An element, or a framework component standing for one: a Vue instance
 * (`$el`) is taken as the element it renders, so a step can point at a
 * component's ref and be given the box the reader sees — the whole field,
 * not the `<input>` inside its border.
 */
function rootOf(value: unknown): Element | null {
    if (!value) return null;
    if (value instanceof Element) return value;
    const root = (value as { $el?: unknown }).$el;
    return root instanceof Element ? root : null;
}

export function createTour(config: TourConfig = {}): TourHandle {
    let current: TourConfig = { ...config };
    const id = `vt-tour-${++counter}`;
    const locale = (): Locale => current.locale ?? en;
    const part = partResolver({
        style: tourStyle,
        unstyled: () => !!current.unstyled,
        classes: () => current.classes,
        pt: () => current.pt,
        props: () => current as Record<string, unknown>
    });

    const state: TourState = {};
    /** A step shown with `highlight()`, in place of the tour's steps. */
    let lone: TourStep | null = null;
    const steps = (): TourStep[] => (lone ? [lone] : (current.steps ?? []));

    let layer: HTMLElement | null = null;
    let root: ReturnType<typeof createRoot> | null = null;
    const els: Partial<Record<keyof TourPopoverDom | 'path' | 'popover', Element | null>> = {};
    let stopAnchor: (() => void) | null = null;
    let anchored: { element: Element; popover: Element; placement: string; arrow: boolean } | null = null;
    let stopLayer: (() => void) | null = null;
    let stopAdvance: (() => void) | null = null;
    let returnFocus: HTMLElement | null = null;
    let marked: { element: Element; classes: string[] } | null = null;
    /** Bumped by every move, so a slow `beforeShow` or a wait that lost the race does nothing. */
    let token = 0;
    /** The stage as drawn, and the one it is moving to. */
    let drawn: TourRect | null = null;
    let tween = 0;
    let frame = 0;
    let pendingEnd: TourEndReason | null = null;
    let resizeObserver: ResizeObserver | null = null;

    /** The gap around the element: snug by default, the element and two pixels. */
    const paddingOf = (step: TourStep | undefined) => step?.stagePadding ?? current.stagePadding ?? 2;

    const hookOptions = (): TourHookOptions<TourHandle> => ({ config: current, state, tour: handle });

    function call(hook: TourElementHook | undefined, element: Element | undefined, step: TourStep) {
        hook?.(element, step, hookOptions());
    }

    const emit = <K extends keyof NonNullable<TourConfig['on']>>(name: K, ...args: Parameters<NonNullable<NonNullable<TourConfig['on']>[K]>>) => {
        (current.on?.[name] as ((...a: unknown[]) => void) | undefined)?.(...(args as unknown[]));
    };

    // ---- remembering where the reader got to

    const storage = () => {
        if (!current.storageKey) return null;
        if (current.storage) return current.storage;
        try {
            return typeof localStorage === 'undefined' ? null : localStorage;
        } catch {
            return null;
        }
    };
    function save(index: number, done: boolean) {
        try {
            storage()?.setItem(current.storageKey!, JSON.stringify({ index, done }));
        } catch {
            // A full or refused storage only costs the resume.
        }
    }
    function saved() {
        try {
            return readProgress(storage()?.getItem(current.storageKey!));
        } catch {
            return null;
        }
    }

    // ---- the layer

    const direction = (): 'ltr' | 'rtl' => {
        if (current.dir) return current.dir;
        if (!isClient) return 'ltr';
        const near = state.activeElement?.closest('[dir]')?.getAttribute('dir') ?? document.documentElement.dir;
        return near === 'rtl' ? 'rtl' : 'ltr';
    };

    const animate = () => current.animate !== false && !reducedMotion();

    function host(): HTMLElement {
        let target = current.overlayTarget;
        for (let depth = 0; typeof target === 'function' && depth < 4; depth++) target = target();
        if (typeof target === 'string') return (target === 'body' ? null : document.querySelector<HTMLElement>(target)) ?? document.body;
        if (target instanceof HTMLElement) return target;
        return overlayContainerOf(state.activeElement ?? null) ?? document.body;
    }

    function init() {
        if (layer || !isClient) return;
        if (!current.unstyled) {
            const options = { nonce: current.nonce, cssLayer: current.cssLayer };
            loadStyle(baseStyle.name, baseStyle.css, options);
            loadStyle(tourStyle.name, tourStyle.css, options);
        }
        returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        layer = document.createElement('div');
        root = createRoot(layer);
        host().appendChild(layer);
        ZIndex.set('modal', layer, current.zIndex ?? 1100);
        state.isInitialized = true;

        window.addEventListener('resize', schedule);
        window.addEventListener('scroll', schedule, { capture: true, passive: true });
        document.addEventListener('keydown', onKeydown);
        stopLayer = pushLayer({
            elements: () => [els.popover, state.activeElement],
            onEscape: () => {
                if (current.allowKeyboardControl !== false && current.allowClose !== false) end('escape');
            }
        });
    }

    function teardown() {
        token++;
        cancelAnimationFrame(frame);
        stopAnchor?.();
        stopAnchor = null;
        anchored = null;
        stopAdvance?.();
        stopAdvance = null;
        stopLayer?.();
        stopLayer = null;
        resizeObserver?.disconnect();
        resizeObserver = null;
        unmark();
        if (isClient) {
            window.removeEventListener('resize', schedule);
            window.removeEventListener('scroll', schedule, { capture: true } as EventListenerOptions);
            document.removeEventListener('keydown', onKeydown);
        }
        root?.clear();
        if (layer) {
            ZIndex.clear(layer);
            layer.remove();
        }
        layer = null;
        root = null;
        drawn = null;
        for (const key of Object.keys(els)) delete els[key as keyof typeof els];
    }

    // ---- the highlighted element

    function mark(element: Element | undefined, step: TourStep) {
        unmark();
        if (!element) return;
        const interactive = !(step.disableActiveInteraction ?? current.disableActiveInteraction);
        const cls = part('activeElement', { interactive }).class as string | undefined;
        const classes = (cls ?? '').split(/\s+/).filter((c) => c && !element.classList.contains(c));
        element.classList.add(...classes);
        marked = { element, classes };
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(schedule);
            resizeObserver.observe(element);
        }
    }

    function unmark() {
        if (marked) marked.element.classList.remove(...marked.classes);
        marked = null;
        resizeObserver?.disconnect();
        resizeObserver = null;
    }

    /**
     * The box the overlay is drawn in. Not the window: the layer covers the
     * page without the scrollbar, and inside an overlay scope that contains
     * fixed elements it covers only that. Measuring it is what keeps the hole
     * exactly over the element whatever the layer ended up covering.
     */
    function layerBox(): TourRect {
        if (!layer) return { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
        const box = layer.getBoundingClientRect();
        return { x: box.left, y: box.top, width: box.width || window.innerWidth, height: box.height || window.innerHeight };
    }

    /** The element's box grown by the padding, in the layer's own coordinates. */
    function stageNow(): TourRect | null {
        const element = state.activeElement;
        const step = state.activeStep;
        if (!element || !element.isConnected) return null;
        const box = element.getBoundingClientRect();
        const origin = layerBox();
        return stageOf({ x: box.left - origin.x, y: box.top - origin.y, width: box.width, height: box.height }, paddingOf(step));
    }

    /**
     * The corner of the gap: the element's own corner grown by the padding,
     * so the outline follows a pill button or a round avatar rather than
     * boxing it — unless a radius was asked for.
     */
    const radius = () => {
        const asked = state.activeStep?.stageRadius ?? current.stageRadius;
        if (asked !== undefined) return asked;
        const element = state.activeElement;
        const own = element ? parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0 : 0;
        return own > 0 ? own + paddingOf(state.activeStep) : 0;
    };

    function drawStage(stage: TourRect | null) {
        drawn = stage;
        const { width, height } = layerBox();
        els.path?.setAttribute('d', overlayPath(width, height, stage, radius()));
        const overlay = els.path?.parentElement;
        overlay?.setAttribute('viewBox', `0 0 ${width} ${height}`);
        placeOver(stage);
    }

    /** The `'over'` side: the popover centred on the element, kept on the screen. */
    function placeOver(stage: TourRect | null) {
        const popover = els.popover as HTMLElement | undefined;
        if (!popover || !stage || sideOf(state.activeStep) !== 'over') return;
        const w = popover.offsetWidth;
        const hgt = popover.offsetHeight;
        const clamp = (v: number, max: number) => Math.max(8, Math.min(v, max - 8));
        const { width, height } = layerBox();
        popover.style.left = `${clamp(stage.x + stage.width / 2 - w / 2, width - w)}px`;
        popover.style.top = `${clamp(stage.y + stage.height / 2 - hgt / 2, height - hgt)}px`;
    }

    /** Moves the stage to where the element is now: in steps when moving between elements, at once while scrolling. */
    function moveStage(smooth: boolean) {
        cancelAnimationFrame(frame);
        const target = stageNow();
        if (!smooth || !drawn || !target || typeof requestAnimationFrame !== 'function') {
            drawStage(target);
            return;
        }
        const from = drawn;
        const start = performance.now();
        const run = ++tween;
        const stepFrame = (now: number) => {
            if (run !== tween || !layer) return;
            const t = Math.min(1, (now - start) / 300);
            drawStage(tweenRect(from, stageNow() ?? target, t));
            if (t < 1) frame = requestAnimationFrame(stepFrame);
        };
        frame = requestAnimationFrame(stepFrame);
    }

    function schedule() {
        if (!layer || typeof requestAnimationFrame !== 'function') return;
        cancelAnimationFrame(frame);
        tween++;
        frame = requestAnimationFrame(() => drawStage(stageNow()));
    }

    const sideOf = (step: TourStep | undefined) => step?.popover?.side ?? 'bottom';

    // ---- drawing

    function render() {
        if (!root || !layer || state.activeIndex === undefined || !state.activeStep) return;
        const list = steps();
        const step = state.activeStep;
        const index = state.activeIndex;
        const { current: at, total } = lone ? { current: 1, total: 1 } : positionOf(list, index);
        const buttons = buttonsOf(step, lone ? { ...current, showButtons: current.showButtons ?? ['close'] } : current);
        const last = lone || nextShownIndex(list, index, 1) < 0;
        if (!lone && nextShownIndex(list, index, -1) < 0) buttons.disabled.add('previous');
        const t = locale().tour;
        const overlayStyle: Record<string, string> = {};
        if (current.overlayColor) overlayStyle.fill = current.overlayColor;
        if (current.overlayOpacity !== undefined) overlayStyle.opacity = String(current.overlayOpacity);
        const context: TourStepContext = { step, index, total: list.length, direction: 0 };
        const centered = !state.activeElement;

        layer.setAttribute('dir', direction());
        root.attrs(part('root', { animate: animate() }));
        root.render(
            tourView({
                id,
                locale: locale(),
                part,
                step,
                index,
                current: at,
                total,
                centered,
                animate: animate(),
                dir: direction(),
                allowHtml: !!current.allowHtml,
                showProgress: !!optionOf(step, current, 'showProgress'),
                progressStyle: step.popover?.progressStyle ?? current.progressStyle ?? 'text',
                progressText: (optionOf(step, current, 'progressText') as string | undefined) ?? t.progress,
                buttons,
                nextText: last ? ((optionOf(step, current, 'doneBtnText') as string | undefined) ?? t.done) : ((optionOf(step, current, 'nextBtnText') as string | undefined) ?? t.next),
                previousText: (optionOf(step, current, 'prevBtnText') as string | undefined) ?? t.previous,
                popoverClass: current.popoverClass,
                arrow: !!current.arrow,
                ariaLabel: current.ariaLabel,
                viewport: { width: layerBox().width, height: layerBox().height },
                path: overlayPath(layerBox().width, layerBox().height, drawn, radius()),
                overlayStyle,
                content: current.slots?.content?.(context),
                refs: {
                    path: (el) => (els.path = el),
                    popover: (el) => (els.wrapper = els.popover = el),
                    arrow: (el) => (els.arrow = el),
                    title: (el) => (els.title = el),
                    description: (el) => (els.description = el),
                    footer: (el) => (els.footer = el),
                    progress: (el) => (els.progress = el),
                    footerButtons: (el) => (els.footerButtons = el),
                    previous: (el) => (els.previousButton = el),
                    next: (el) => (els.nextButton = el),
                    close: (el) => (els.closeButton = el)
                },
                on: {
                    overlay: onOverlayClick,
                    next: () => press('next'),
                    previous: () => press('previous'),
                    close: () => press('close')
                }
            })
        );
        position();
    }

    function position() {
        const popover = els.popover as HTMLElement | undefined;
        const element = state.activeElement;
        const side = sideOf(state.activeStep);
        if (!popover || !element || side === 'over') {
            stopAnchor?.();
            stopAnchor = null;
            anchored = null;
            if (popover && side !== 'over') delete popover.dataset.placement;
            return;
        }
        const placement = placementOf(side, state.activeStep?.popover?.align ?? 'start');
        if (anchored && anchored.element === element && anchored.popover === popover && anchored.placement === placement && anchored.arrow === !!current.arrow) return;
        stopAnchor?.();
        const padding = paddingOf(state.activeStep);
        stopAnchor = anchorTo(element, popover, {
            placement: placement as Placement,
            offset: padding + (current.popoverOffset ?? 10),
            arrow: current.arrow ? (els.arrow as HTMLElement | null) : null,
            arrowPadding: 12
        });
        anchored = { element, popover, placement, arrow: !!current.arrow };
    }

    function popoverDom(): TourPopoverDom | undefined {
        if (!els.popover) return undefined;
        return {
            wrapper: els.popover as HTMLElement,
            arrow: els.arrow as HTMLElement,
            title: els.title as HTMLElement,
            description: els.description as HTMLElement,
            footer: els.footer as HTMLElement,
            progress: els.progress as HTMLElement,
            previousButton: els.previousButton as HTMLButtonElement,
            nextButton: els.nextButton as HTMLButtonElement,
            closeButton: els.closeButton as HTMLButtonElement,
            footerButtons: els.footerButtons as HTMLElement
        };
    }

    // ---- what the reader does

    function press(button: 'next' | 'previous' | 'close') {
        const step = state.activeStep;
        if (!step) return;
        const hook =
            button === 'next'
                ? (step.popover?.onNextClick ?? current.onNextClick)
                : button === 'previous'
                  ? (step.popover?.onPrevClick ?? current.onPrevClick)
                  : (step.popover?.onCloseClick ?? current.onCloseClick);
        if (hook) return call(hook, state.activeElement, step);
        if (button === 'close') end('close');
        else if (button === 'previous') void handle.movePrevious();
        else if (handle.isLastStep()) end('complete');
        else void handle.moveNext();
    }

    function onOverlayClick() {
        const step = state.activeStep;
        if (!step) return;
        const behavior = current.overlayClickBehavior ?? 'close';
        if (typeof behavior === 'function') call(behavior, state.activeElement, step);
        else if (behavior === 'nextStep') press('next');
        else if (current.allowClose !== false && current.dismissableMask !== false) end('overlay');
    }

    function onKeydown(event: KeyboardEvent) {
        if (current.allowKeyboardControl === false || !state.activeStep || event.defaultPrevented) return;
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        if (isEditable(event.target)) return;
        const forward = (event.key === 'ArrowRight') !== (direction() === 'rtl');
        const buttons = buttonsOf(state.activeStep, current);
        const which = forward ? 'next' : 'previous';
        if (buttons.disabled.has(which)) return;
        if (!forward && !handle.hasPreviousStep()) return;
        event.preventDefault();
        press(which);
    }

    /** Ends the tour — or, when `onDestroyStarted` is set, asks it to. */
    function end(reason: TourEndReason) {
        if (!state.activeStep) return;
        if (current.onDestroyStarted) {
            pendingEnd = reason;
            call(current.onDestroyStarted, state.activeElement, state.activeStep);
            return;
        }
        finish(reason);
    }

    function finish(reason: TourEndReason) {
        const step = state.activeStep;
        const element = state.activeElement;
        const index = state.activeIndex;
        if (!layer && !step) return;
        pendingEnd = null;
        if (step) {
            call(step.onDeselected, element, step);
            call(current.onDeselected, element, step);
        }
        if (!lone && index !== undefined && current.storageKey) save(index, reason === 'complete');
        teardown();
        const focus = returnFocus;
        returnFocus = null;
        for (const key of Object.keys(state)) delete state[key as keyof TourState];
        lone = null;
        if (step) call(current.onDestroyed, element, step);
        emit('end', { reason, index });
        if (focus?.isConnected) focus.focus({ preventScroll: true });
    }

    // ---- moving

    /**
     * The element, once it is there. A mutation observer answers the moment
     * the page adds it, and a slow tick catches one that was there all along
     * but hidden behind a function's condition; either way the wait ends as
     * soon as it can, and gives up after `wait` milliseconds.
     */
    function waitForElement(element: TourElement, wait: number, run: number): Promise<Element | null> {
        const found = findElement(element);
        if (found || !element || wait <= 0 || typeof MutationObserver === 'undefined') return Promise.resolve(found);
        return new Promise((resolve) => {
            let settled = false;
            const finish = (value: Element | null) => {
                if (settled) return;
                settled = true;
                observer.disconnect();
                clearInterval(tick);
                clearTimeout(limit);
                resolve(value);
            };
            const check = () => {
                if (run !== token) return finish(null);
                const now = findElement(element);
                if (now) finish(now);
            };
            // A framework puts the element in first and hands out its ref a moment
            // later, so the look is taken after the mutation's own task.
            const observer = new MutationObserver(() => queueMicrotask(check));
            observer.observe(document.body, { childList: true, subtree: true, attributes: true });
            const tick = setInterval(check, 100);
            const limit = setTimeout(() => finish(findElement(element)), wait);
        });
    }

    async function show(index: number, dir: TourStepContext['direction']): Promise<void> {
        const run = ++token;
        const list = steps();
        const step = list[index];
        if (!step) return;
        const context: TourStepContext = { step, index, total: list.length, direction: dir };

        if (step.beforeShow) {
            const answer = await step.beforeShow(context);
            if (run !== token || answer === false) return;
        }
        const element = (await waitForElement(step.element, step.waitFor ?? current.elementTimeout ?? 0, run)) ?? undefined;
        if (run !== token) return;
        if (!element && step.element && current.missingElement === 'skip') {
            const next = nextShownIndex(list, index, dir === -1 ? -1 : 1);
            if (next >= 0) return show(next, dir === -1 ? -1 : 1);
            if (dir !== -1) end('complete');
            return;
        }

        init();
        if (!layer) return;

        const previous = state.activeStep;
        const previousElement = state.activeElement;
        if (previous) {
            call(previous.onDeselected, previousElement, previous);
            call(current.onDeselected, previousElement, previous);
        }
        state.previousStep = previous;
        state.previousElement = previousElement;
        state.activeIndex = index;
        state.activeStep = step;
        state.activeElement = element;

        call(step.onHighlightStarted, element, step);
        call(current.onHighlightStarted, element, step);

        mark(element, step);
        if (element && typeof (element as HTMLElement).scrollIntoView === 'function') {
            const rect = element.getBoundingClientRect();
            const outside = rect.top < 0 || rect.left < 0 || rect.bottom > window.innerHeight || rect.right > window.innerWidth;
            if (outside) element.scrollIntoView({ behavior: current.smoothScroll ? 'smooth' : 'auto', block: 'center', inline: 'nearest' });
        }

        render();
        moveStage(animate() && !!previous);
        (els.popover as HTMLElement | undefined)?.focus({ preventScroll: true });
        state.popover = popoverDom();

        call(step.onHighlighted, element, step);
        call(current.onHighlighted, element, step);
        const dom = state.popover;
        if (dom) {
            (step.popover?.onPopoverRender ?? current.onPopoverRender)?.(dom, hookOptions());
        }

        listenForAdvance(step, element);
        if (!lone && current.storageKey) save(index, false);
        if (!previous) emit('start', index);
        emit('step-change', { index, step, element });
    }

    function listenForAdvance(step: TourStep, element: Element | undefined) {
        stopAdvance?.();
        stopAdvance = null;
        const advance = step.advanceOn;
        if (!advance) return;
        const target = advance.selector ? document.querySelector(advance.selector) : element;
        if (!target) return;
        const listener = () => {
            // After the reader's own handler has run, so what they did has happened before the tour moves.
            setTimeout(() => {
                if (state.activeStep !== step) return;
                if (handle.isLastStep()) end('complete');
                else void handle.moveNext();
            });
        };
        target.addEventListener(advance.event, listener);
        stopAdvance = () => target.removeEventListener(advance.event, listener);
    }

    // ---- the handle

    const handle: TourHandle = {
        isActive: () => !!state.activeStep,
        refresh() {
            if (!state.activeStep) return;
            render();
            drawStage(stageNow());
        },
        async drive(step) {
            lone = null;
            const list = steps();
            let start = step === undefined ? -1 : stepIndexOf(list, step);
            if (step === undefined) {
                const resume = current.storageKey ? saved() : null;
                start = resume && !resume.done && resume.index < list.length ? resume.index : 0;
            }
            if (start < 0) return;
            const index = nextShownIndex(list, start, 0);
            if (index < 0) return;
            await show(index, 0);
        },
        setConfig(next) {
            current = { ...next };
            if (state.activeStep) render();
        },
        setSteps(next) {
            current = { ...current, steps: next };
            if (state.activeStep) render();
        },
        getConfig: () => current,
        getState: ((key?: keyof TourState) => (key ? state[key] : { ...state })) as TourHandle['getState'],
        getActiveIndex: () => state.activeIndex,
        isFirstStep: () => state.activeIndex !== undefined && nextShownIndex(steps(), state.activeIndex, -1) < 0,
        isLastStep: () => state.activeIndex !== undefined && nextShownIndex(steps(), state.activeIndex, 1) < 0,
        getActiveStep: () => state.activeStep,
        getActiveElement: () => state.activeElement,
        getPreviousElement: () => state.previousElement,
        getPreviousStep: () => state.previousStep,
        hasNextStep: () => state.activeIndex !== undefined && nextShownIndex(steps(), state.activeIndex, 1) >= 0,
        hasPreviousStep: () => state.activeIndex !== undefined && nextShownIndex(steps(), state.activeIndex, -1) >= 0,
        async moveNext() {
            if (state.activeIndex === undefined) return;
            const next = nextShownIndex(steps(), state.activeIndex, 1);
            if (next < 0) return finish('complete');
            await show(next, 1);
        },
        async movePrevious() {
            if (state.activeIndex === undefined) return;
            const previous = nextShownIndex(steps(), state.activeIndex, -1);
            if (previous >= 0) await show(previous, -1);
        },
        async moveTo(step) {
            const index = stepIndexOf(steps(), step);
            if (index < 0) return;
            const from = state.activeIndex ?? index;
            await show(index, index > from ? 1 : index < from ? -1 : 0);
        },
        async highlight(step) {
            lone = step;
            await show(0, 0);
        },
        destroy() {
            finish(pendingEnd ?? 'api');
        },
        update(next) {
            current = { ...current, ...next };
            if (state.activeStep) render();
        },
        setLocale(next) {
            handle.update({ locale: next });
        },
        isCompleted: () => !!saved()?.done,
        reset() {
            try {
                storage()?.removeItem(current.storageKey!);
            } catch {
                // Nothing to forget.
            }
        }
    };

    return handle;
}


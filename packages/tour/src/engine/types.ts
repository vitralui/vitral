import type { OverlayTarget } from '@vitral/controls';
import type { Locale } from '@vitral/core';
import type { PassThrough } from '@vitral/dom';
import type { ClassEntry } from '@vitral/styles';

/**
 * The tour's options: its steps, what each step's popover shows, how the
 * overlay behaves, and the hooks that run as the tour moves.
 */

/** Which side of the element the popover sits on; `'over'` puts it on top of the element. */
export type TourSide = 'top' | 'right' | 'bottom' | 'left' | 'over';
export type TourAlign = 'start' | 'center' | 'end';
export type TourButton = 'next' | 'previous' | 'close';

/** A component instance a framework hands out: a Vue one's `$el` is the element it renders. */
export interface TourComponentLike {
    $el?: unknown;
}

/**
 * A selector, an element, a component standing for one, or a function
 * returning either — looked up when its step is shown, not before.
 */
export type TourElement = string | Element | TourComponentLike | (() => Element | TourComponentLike | null | undefined) | null | undefined;

/** Why the tour ended. */
export type TourEndReason = 'complete' | 'close' | 'escape' | 'overlay' | 'api';

/** How a step's progress is drawn: the text, a dot a step, or a bar. */
export type TourProgressStyle = 'text' | 'dots' | 'bar';

export interface TourState {
    isInitialized?: boolean;
    activeIndex?: number;
    activeElement?: Element;
    activeStep?: TourStep;
    previousElement?: Element;
    previousStep?: TourStep;
    /** The popover's parts, while one is shown. */
    popover?: TourPopoverDom;
}

/** The popover's elements, handed to `onPopoverRender` so a hook can add to them. */
export interface TourPopoverDom {
    wrapper: HTMLElement;
    arrow: HTMLElement;
    title: HTMLElement;
    description: HTMLElement;
    footer: HTMLElement;
    progress: HTMLElement;
    previousButton: HTMLButtonElement;
    nextButton: HTMLButtonElement;
    closeButton: HTMLButtonElement;
    footerButtons: HTMLElement;
}

export interface TourHookOptions<H = unknown> {
    config: TourConfig;
    state: TourState;
    /** The tour itself. */
    tour: H;
}

export type TourElementHook = (element: Element | undefined, step: TourStep, options: TourHookOptions) => void;
export type TourPopoverHook = (popover: TourPopoverDom, options: TourHookOptions) => void;

/** What a step's `when`, `beforeShow` and content slot are told. */
export interface TourStepContext {
    step: TourStep;
    index: number;
    /** Steps in the tour. */
    total: number;
    /** Which way the tour is going: 1 forward, -1 back, 0 a jump. */
    direction: 1 | -1 | 0;
}

export interface TourPopover {
    title?: string;
    description?: string;
    side?: TourSide;
    align?: TourAlign;
    showButtons?: TourButton[];
    disableButtons?: TourButton[];
    nextBtnText?: string;
    prevBtnText?: string;
    doneBtnText?: string;
    showProgress?: boolean;
    /** `'{current} of {total}'`; `{{current}}` reads too. */
    progressText?: string;
    popoverClass?: string;
    onPopoverRender?: TourPopoverHook;
    /** Replaces what the button does: the hook moves the tour itself, or does not. */
    onNextClick?: TourElementHook;
    onPrevClick?: TourElementHook;
    onCloseClick?: TourElementHook;
    /** A picture above the title. */
    image?: { src: string; alt?: string };
    /** This step's progress drawn otherwise. */
    progressStyle?: TourProgressStyle;
}

export interface TourStep {
    element?: TourElement;
    popover?: TourPopover;
    /** The element cannot be clicked or typed into while it is shown. */
    disableActiveInteraction?: boolean;
    onHighlightStarted?: TourElementHook;
    onHighlighted?: TourElementHook;
    onDeselected?: TourElementHook;

    /** A name for `moveTo('billing')`. */
    id?: string;
    /** The step is shown only when this says so; otherwise the tour passes over it. */
    when?: (context: TourStepContext) => boolean;
    /**
     * Runs before the step is shown, and is waited for — open the
     * menu the step points into, load the panel. Returning `false` keeps the
     * tour where it was.
     */
    beforeShow?: (context: TourStepContext) => void | boolean | Promise<void | boolean>;
    /** The tour moves on by itself when the reader does this — `{ event: 'click' }` on the element, or on `selector`. */
    advanceOn?: { event: string; selector?: string };
    /** How long to wait for the element to appear, in milliseconds; the tour's `elementTimeout` otherwise. */
    waitFor?: number;
    /** This step's own gap around the element and corner. */
    stagePadding?: number;
    stageRadius?: number;
}

export interface TourConfig {
    steps?: TourStep[];
    /** Move the highlight from step to step rather than jump. Defaults to true (and off under reduced motion). */
    animate?: boolean;
    /** The overlay's colour and opacity; the theme's otherwise. */
    overlayColor?: string;
    overlayOpacity?: number;
    /** Scroll the element into view smoothly. Defaults to false. */
    smoothScroll?: boolean;
    /** Escape, the close button and a press on the overlay end the tour. Defaults to true. */
    allowClose?: boolean;
    /** What a press on the overlay does. Defaults to `'close'`. */
    overlayClickBehavior?: 'close' | 'nextStep' | TourElementHook;
    /**
     * Named as the dialogs name it: `false` keeps a press on the
     * overlay from ending the tour, the way a dialog keeps its mask. Defaults
     * to true. A `'nextStep'` or a hook in `overlayClickBehavior` still runs.
     */
    dismissableMask?: boolean;
    /** A pointer from the popover to the element. Off by default, as Vitral's popovers have none. */
    arrow?: boolean;
    /** The gap around the element, in pixels. Defaults to 2, so the highlight hugs it. */
    stagePadding?: number;
    /** The corner of the gap, in pixels. Defaults to the element's own corner, grown by the padding. */
    stageRadius?: number;
    disableActiveInteraction?: boolean;
    /** Escape and the arrow keys. Defaults to true. */
    allowKeyboardControl?: boolean;
    popoverClass?: string;
    /** Between the gap and the popover, in pixels. Defaults to 10. */
    popoverOffset?: number;
    /** Defaults to all three. */
    showButtons?: TourButton[];
    disableButtons?: TourButton[];
    showProgress?: boolean;
    progressText?: string;
    nextBtnText?: string;
    prevBtnText?: string;
    doneBtnText?: string;

    onPopoverRender?: TourPopoverHook;
    onHighlightStarted?: TourElementHook;
    onHighlighted?: TourElementHook;
    onDeselected?: TourElementHook;
    /** Set, the tour does not end on Escape, the close button or the last Next: the hook decides, and calls `destroy()`. */
    onDestroyStarted?: TourElementHook;
    onDestroyed?: TourElementHook;
    onNextClick?: TourElementHook;
    onPrevClick?: TourElementHook;
    onCloseClick?: TourElementHook;

    // ---- the page it lives in

    /** Where the popover's words come from. English otherwise. */
    locale?: Locale;
    /** Titles and descriptions are HTML rather than text. Off by default: only for text you wrote. */
    allowHtml?: boolean;
    /** How long any step waits for its element to appear, in milliseconds. Defaults to 0. */
    elementTimeout?: number;
    /** A step whose element is not there: shown in the middle of the screen (the default), or passed over. */
    missingElement?: 'center' | 'skip';
    progressStyle?: TourProgressStyle;
    /**
     * Remembers where the reader got to under this key, and whether they
     * finished: `drive()` with no step picks up there. `storage` is
     * `localStorage` unless another is given.
     */
    storageKey?: string;
    storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
    /** Names the popover when a step has no title. */
    ariaLabel?: string;
    /** Reading direction; the arrow keys and the buttons follow it. Read from the page otherwise. */
    dir?: 'ltr' | 'rtl';
    /** What a framework puts in the popover, below the description. */
    slots?: { content?: (context: TourStepContext) => Node | null | undefined };
    unstyled?: boolean;
    classes?: Partial<Record<string, ClassEntry>>;
    pt?: PassThrough;
    nonce?: string;
    cssLayer?: string | false;
    /** Where the tour's layer is put; the nearest overlay scope, else the body. */
    overlayTarget?: OverlayTarget;
    zIndex?: number;
    on?: {
        start?: (index: number) => void;
        'step-change'?: (context: { index: number; step: TourStep; element: Element | undefined }) => void;
        end?: (context: { reason: TourEndReason; index: number | undefined }) => void;
    };
}

import type { TourAlign, TourButton, TourConfig, TourEndReason, TourPopover, TourProgressStyle, TourSide, TourStep, TourStepContext } from '@vitral/tour';
import type { BaseProps } from '../../base/types';

export type { TourAlign, TourButton, TourConfig, TourEndReason, TourPopover, TourProgressStyle, TourSide, TourStep, TourStepContext };

/**
 * `@vitral/tour`'s options as props, with `v-model:open`
 * to start and end it and `v-model:step` for where it is. The hooks
 * (`onNextClick`, `onDestroyStarted`…) and anything else go in `options`.
 */
export interface TourProps extends BaseProps {
    steps?: TourStep[];
    /** Move the highlight from step to step and fade each popover in. Off by default. */
    animate?: boolean;
    /** How long a move takes when `animate` is on, in milliseconds. Defaults to 300. */
    animationDuration?: number;
    overlayColor?: string;
    overlayOpacity?: number;
    smoothScroll?: boolean;
    /** Bring each step's element into view. Defaults to true; off, the page stays put and the popover stays on screen. */
    scrollIntoView?: boolean;
    /** Where a scrolled-to element ends up. Defaults to `'center'`. */
    scrollBlock?: 'start' | 'center' | 'end' | 'nearest';
    /** Keep the popover on the screen even when its element is not. Defaults to true. */
    keepInView?: boolean;
    /**
     * Goes to another page for a step whose `page` is not this one — a
     * router's `push`: `(page) => router.push(page)`. Without it, the page is
     * loaded, and a `<Tour>` there picks the tour up by itself.
     */
    navigate?: (page: string) => void | Promise<unknown>;
    /** Escape, the close button and a press on the overlay end the tour. Defaults to true. */
    allowClose?: boolean;
    overlayClickBehavior?: 'close' | 'nextStep';
    /** `false` keeps a press on the overlay from ending the tour, as on a dialog's mask. Defaults to true. */
    dismissableMask?: boolean;
    /** A pointer from the popover to the element. Off by default. */
    arrow?: boolean;
    /** The gap around the element, in pixels. Defaults to 2, so the highlight hugs it. */
    stagePadding?: number;
    /** The corner of the gap. Defaults to the element's own corner, grown by the padding. */
    stageRadius?: number;
    disableActiveInteraction?: boolean;
    /** Defaults to true. */
    allowKeyboardControl?: boolean;
    popoverClass?: string;
    popoverOffset?: number;
    showButtons?: TourButton[];
    disableButtons?: TourButton[];
    showProgress?: boolean;
    /** `'{current} of {total}'`; the locale's otherwise. */
    progressText?: string;
    progressStyle?: TourProgressStyle;
    nextBtnText?: string;
    prevBtnText?: string;
    doneBtnText?: string;
    /** Titles and descriptions are HTML. Only for text you wrote. */
    allowHtml?: boolean;
    /** How long a step waits for its element to appear, in milliseconds. */
    elementTimeout?: number;
    missingElement?: 'center' | 'skip';
    /** Remembers where the reader got to, and whether they finished, under this key. */
    storageKey?: string;
    /** Everything else `createTour` takes: the hooks, `storage`, `dir`. */
    options?: TourConfig;
    appendTo?: string | HTMLElement;
}

export interface TourEmits {
    start: [index: number];
    'step-change': [context: { index: number; step: TourStep; element: Element | undefined }];
    end: [context: { reason: TourEndReason; index: number | undefined }];
}

export interface TourSlots {
    /** Drawn in the popover below the description, for every step. */
    content?: (context: TourStepContext) => unknown;
}

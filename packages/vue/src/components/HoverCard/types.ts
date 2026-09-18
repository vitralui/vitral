import type { BaseProps, OverlayPlacement } from '../../base/types';

export interface HoverCardProps extends BaseProps {
    /** Milliseconds the pointer (or keyboard focus) rests before the card opens. Defaults to 700. */
    openDelay?: number;
    /** Milliseconds after the pointer leaves before it closes. Defaults to 300. */
    closeDelay?: number;
    /** Where it opens relative to the trigger. Defaults to `'bottom'`. */
    placement?: OverlayPlacement;
    /** Gap to the trigger, in pixels. Defaults to 8. */
    offset?: number;
    disabled?: boolean;
}

export type HoverCardEmits = {
    show: [];
    hide: [];
};

export interface HoverCardSlots {
    /** What opens the card — usually a link, which keeps working on its own. */
    trigger?: () => unknown;
    /** The card's content: a preview of what the trigger points at. */
    default?: () => unknown;
}

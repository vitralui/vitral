import type { BaseProps, OverlayPlacement } from '../../base/types';

export interface PopoverProps extends BaseProps {
    /** A pointer from the panel to what opened it, on whichever side the panel ends up. The plugin's `overlayArrow` otherwise, which is off. */
    arrow?: boolean;
    /** Where it opens relative to its target; it flips when there is no room. Defaults to `'bottom-start'`. */
    placement?: OverlayPlacement;
    /** Close on a press outside. Defaults to true. */
    dismissable?: boolean;
    /** Defaults to true. */
    closeOnEscape?: boolean;
    /** Gap to the target, in pixels. Defaults to 8. */
    offset?: number;
    /** `'body'` (the default), `'self'` to render in place, or a selector. */
    appendTo?: string;
}

export type PopoverEmits = {
    show: [];
    hide: [];
};

export interface PopoverSlots {
    default?: (props: { closeCallback: () => void }) => unknown;
}

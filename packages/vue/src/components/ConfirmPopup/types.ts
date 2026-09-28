import type { BaseProps, OverlayPlacement } from '../../base/types';
import type { ConfirmOptions } from '../../config/services';

export interface ConfirmPopupProps extends BaseProps {
    /** A pointer from the panel to what opened it, on whichever side the panel ends up. The plugin's `overlayArrow` otherwise, which is off. */
    arrow?: boolean;
    /** Answers only the `useConfirm().require()` calls sent with the same `group` and a `target`. */
    group?: string;
    /** Where it opens relative to the target. Defaults to `'bottom'`. */
    placement?: OverlayPlacement;
}

export interface ConfirmPopupSlots {
    /** Replaces the message; it still describes the popup. */
    message?: (props: { message: ConfirmOptions }) => unknown;
    icon?: (props: { message: ConfirmOptions }) => unknown;
}

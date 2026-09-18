import type { BaseProps, OverlayPlacement } from '../../base/types';
import type { ConfirmOptions } from '../../config/services';

export interface ConfirmPopupProps extends BaseProps {
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

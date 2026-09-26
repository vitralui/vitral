import type { BaseProps } from '../../base/types';
import type { ConfirmOptions } from '../../config/services';

export interface ConfirmDialogProps extends BaseProps {
    /** Answers only the `useConfirm().require()` calls sent with the same `group`. */
    group?: string;
    /** Move the dialog by dragging its header. Defaults to true. */
    draggable?: boolean;
    /** While it is dragged, keep the whole dialog on the screen. Defaults to true. */
    keepInViewport?: boolean;
}

export interface ConfirmDialogSlots {
    /** Replaces the message text; it still describes the dialog. */
    message?: (props: { message: ConfirmOptions }) => unknown;
    icon?: (props: { message: ConfirmOptions }) => unknown;
}

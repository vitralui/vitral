import type { BaseProps } from '../../base/types';
import type { ConfirmOptions } from '../../config/services';

export interface ConfirmDialogProps extends BaseProps {
    /** Answers only the `useConfirm().require()` calls sent with the same `group`. */
    group?: string;
}

export interface ConfirmDialogSlots {
    /** Replaces the message text; it still describes the dialog. */
    message?: (props: { message: ConfirmOptions }) => unknown;
    icon?: (props: { message: ConfirmOptions }) => unknown;
}

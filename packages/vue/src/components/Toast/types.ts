import type { BaseProps } from '../../base/types';
import type { ToastMessage } from '../../config/services';

export type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center';

export interface ToastProps extends BaseProps {
    /** Defaults to `'top-right'`. */
    position?: ToastPosition;
    /** Shows only the messages sent with the same `group`. */
    group?: string;
}

export interface ToastEvent {
    message: ToastMessage;
}

export type ToastEmits = {
    /** Closed by its close button. */
    close: [event: ToastEvent];
    /** Closed because its `life` ran out. */
    'life-end': [event: ToastEvent];
};

export interface ToastSlots {
    /** Replaces the icon and text of each message; the close button stays. */
    message?: (props: { message: ToastMessage }) => unknown;
    /** Replaces the whole card's inside, close button included. */
    container?: (props: { message: ToastMessage; closeCallback: () => void }) => unknown;
    closeicon?: () => unknown;
}

import type { BaseProps } from '../../base/types';
import type { ToastAction, ToastMessage } from '../../config/services';

export type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center';

export interface ToastProps extends BaseProps {
    /** Defaults to `'top-right'`. */
    position?: ToastPosition;
    /** Shows only the messages sent with the same `group`. */
    group?: string;
    /** At most this many cards at once; pinned ones always show. What happens to the rest is `overflow`'s. */
    max?: number;
    /**
     * Past `max`: `'queue'` (the default) makes a new toast wait until a card
     * leaves; `'replace'` closes the oldest card that is not pinned to make room.
     */
    overflow?: 'queue' | 'replace';
    /** Put the latest at the head of the stack rather than at its end. */
    newestOnTop?: boolean;
    /**
     * Draw the stack as a pile: the newest in front, a few behind it, the rest
     * hidden, all spread out while it is pointed at or holds focus. The
     * countdowns wait while it is spread.
     */
    stacked?: boolean;
    /** A bar on each timed card that shows the life left; a message's `progress` overrides it. */
    showProgress?: boolean;
    /** Hold every countdown while the page is in the background. On by default. */
    pauseOnPageHidden?: boolean;
    /** Let a finger or a pen swipe a card sideways to close it. On by default. */
    swipeToClose?: boolean;
}

export interface ToastEvent {
    message: ToastMessage;
}

export type ToastEmits = {
    /** Closed by its close button. */
    close: [event: ToastEvent];
    /** Closed because its `life` ran out. */
    'life-end': [event: ToastEvent];
    /** One of a message's `actions` was pressed. */
    action: [event: ToastEvent & { action: ToastAction }];
};

export interface ToastSlots {
    /** Replaces the icon and text of each message; the close button stays. */
    message?: (props: { message: ToastMessage }) => unknown;
    /** Replaces the whole card's inside, close button included. */
    container?: (props: { message: ToastMessage; closeCallback: () => void }) => unknown;
    closeicon?: () => unknown;
}

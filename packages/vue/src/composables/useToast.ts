import { useVitral } from '../config/config';
import type { ToastMessage } from '../config/services';

let counter = 0;
const assigned = new WeakMap<ToastMessage, string | number>();

/**
 * Sends messages to the `<Toast>` mounted with the same `group`, from anywhere
 * below the plugin. `add` returns the message's id; `remove` takes the message
 * that was added, or that id.
 */
export function useToast() {
    const { toast } = useVitral();
    return {
        add(message: ToastMessage): string | number {
            const id = message.id ?? `vt-toast-message-${++counter}`;
            assigned.set(message, id);
            toast.emit('add', { ...message, id });
            return id;
        },
        remove(message: ToastMessage | string | number) {
            const id = typeof message === 'object' ? (message.id ?? assigned.get(message)) : message;
            if (id !== undefined) toast.emit('remove', { id });
        },
        removeGroup(group: string) {
            toast.emit('removeGroup', group);
        },
        removeAll() {
            toast.emit('removeAll', undefined);
        }
    };
}

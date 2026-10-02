import { useVitral } from '../config/config';
import type { ToastMessage } from '../config/services';

let counter = 0;
const assigned = new WeakMap<ToastMessage, string | number>();

/** What a settled promise turns its toast into: a message, or a function of the result that returns one. */
export type ToastOutcome<T> = ToastMessage | ((value: T) => ToastMessage);

export interface ToastPromiseMessages<T> {
    /** Shown while the promise runs, with a spinner: no life and no close button unless it says so. */
    loading: ToastMessage;
    success?: ToastOutcome<T>;
    error?: ToastOutcome<unknown>;
}

/**
 * Sends messages to the `<Toast>` mounted with the same `group`, from anywhere
 * below the plugin. `add` takes one message or several and returns their ids;
 * `update` changes a card in place; `promise` follows a promise with one card
 * from loading to its outcome; `remove` takes the message that was added, or
 * its id.
 */
export function useToast() {
    const { toast } = useVitral();

    function addOne(message: ToastMessage): string | number {
        const id = message.id ?? `vt-toast-message-${++counter}`;
        assigned.set(message, id);
        toast.emit('add', { ...message, id });
        return id;
    }

    function add(message: ToastMessage): string | number;
    function add(messages: readonly ToastMessage[]): (string | number)[];
    function add(input: ToastMessage | readonly ToastMessage[]) {
        return Array.isArray(input) ? input.map(addOne) : addOne(input as ToastMessage);
    }

    /** Changes a card in place: its text, its severity, its life (which starts again). */
    function update(id: string | number, patch: Partial<ToastMessage>) {
        toast.emit('update', { id, patch });
    }

    /**
     * One card for a promise: `loading` while it runs, then `success` or
     * `error` in its place — a success or a danger unless the outcome names
     * its severity, with a life of five seconds unless it gives its own. An
     * outcome left out closes the card. Returns the promise, so it can still
     * be awaited.
     */
    function promise<T>(work: Promise<T>, messages: ToastPromiseMessages<T>): Promise<T> {
        const id = addOne({ closable: false, loading: true, ...messages.loading });
        const settle = (outcome: ToastMessage | undefined, severity: ToastMessage['severity']) => {
            if (outcome) update(id, { closable: true, life: 5000, loading: false, icon: undefined, severity, ...outcome });
            else toast.emit('remove', { id });
        };
        work.then(
            (value) => settle(typeof messages.success === 'function' ? messages.success(value) : messages.success, 'success'),
            (error: unknown) => settle(typeof messages.error === 'function' ? messages.error(error) : messages.error, 'danger')
        );
        return work;
    }

    return {
        add,
        update,
        promise,
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

import { inject, type Component, type InjectionKey } from 'vue';
import { useVitral } from '../config/config';
import type { DynamicDialogInstance, DynamicDialogOptions } from '../config/services';

/** What a component shown by `useDialog().open()` injects to read its data and close itself. */
export const DialogRefKey: InjectionKey<DynamicDialogInstance> = Symbol('vt-dialog-ref');

let counter = 0;

/**
 * Opens a `<DynamicDialog>` from code with a component as its content. The
 * dialog mounted once near the root of the app renders it. `open` returns the
 * instance, whose `close(data)` hands `data` to `onClose`.
 */
export function useDialog() {
    const { dialog } = useVitral();
    return {
        open(content: Component, options: DynamicDialogOptions = {}): DynamicDialogInstance {
            const instance: DynamicDialogInstance = {
                id: ++counter,
                content,
                options,
                data: options.data,
                close: (data?: unknown) => dialog.emit('close', { instance, data })
            };
            dialog.emit('open', instance);
            return instance;
        }
    };
}

/**
 * The dialog the current component was opened in, or undefined outside one.
 * Also provided under the string key `'dialogRef'`, as dialog content
 * components expect.
 */
export function useDialogRef(): DynamicDialogInstance | undefined {
    return inject(DialogRefKey, undefined) ?? inject<DynamicDialogInstance | undefined>('dialogRef', undefined);
}

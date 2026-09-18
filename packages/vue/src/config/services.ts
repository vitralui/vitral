import type { IconProp } from '../base/types';

export type ToastSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export interface ToastMessage {
    id?: string | number;
    severity?: ToastSeverity;
    summary?: string;
    detail?: string;
    /** Milliseconds before it closes by itself; omit to keep it until dismissed. */
    life?: number;
    closable?: boolean;
    /** Only a `<Toast>` with the same `group` shows it. */
    group?: string;
    /** Replaces the severity's icon: anything an `icon` prop takes. */
    icon?: IconProp;
    /** Anything a custom `message` slot wants to render. */
    data?: unknown;
}

export interface ToastEvents {
    add: ToastMessage;
    remove: ToastMessage;
    removeGroup: string;
    removeAll: undefined;
}

export interface ConfirmOptions {
    /** Only a `<ConfirmDialog>` with the same `group` answers. */
    group?: string;
    header?: string;
    message?: string;
    /** Anything an `icon` prop takes. */
    icon?: IconProp;
    severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast';
    /**
     * The element the question is about. A request with a target is answered by
     * `<ConfirmPopup>`, anchored to it; one without, by `<ConfirmDialog>`.
     */
    target?: HTMLElement | null;
    acceptLabel?: string;
    rejectLabel?: string;
    /** Which button takes focus when the dialog opens. A destructive action should default to `reject`. */
    defaultFocus?: 'accept' | 'reject';
    accept?: () => void;
    reject?: () => void;
    onHide?: () => void;
}

export interface ConfirmEvents {
    require: ConfirmOptions;
    close: undefined;
}

/** How a dynamic dialog was closed: from code (`dialogRef.close()`), or by the reader (Escape, the close button, the mask). */
export interface DynamicDialogCloseResult {
    type: 'config-close' | 'dialog-close';
    data?: unknown;
}

export interface DynamicDialogOptions {
    /** Props for the `<Dialog>` around the content: `header`, `modal`, `style`, `dismissableMask`… */
    props?: Record<string, unknown>;
    /** Anything the content reads back through its dialog ref. */
    data?: unknown;
    /** Listeners for events the content emits, by name: `{ save: (v) => … }`. */
    emits?: Record<string, (...args: never[]) => unknown>;
    /** Components rendered in the dialog's header and footer. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    templates?: { header?: any; footer?: any };
    onClose?: (result: DynamicDialogCloseResult) => void;
}

/** One open dynamic dialog: what `useDialog().open()` returns and what the content injects as `dialogRef`. */
export interface DynamicDialogInstance {
    readonly id: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly content: any;
    readonly options: DynamicDialogOptions;
    readonly data: unknown;
    /** Closes the dialog; `data` is handed to `onClose`. */
    close(data?: unknown): void;
}

export interface DialogEvents {
    open: DynamicDialogInstance;
    close: { instance: DynamicDialogInstance; data?: unknown };
}

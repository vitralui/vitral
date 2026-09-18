import type { BaseProps } from '../../base/types';

export interface FileUploadProps extends BaseProps {
    /** `advanced` (the default): a drop zone, a queue and upload buttons. `basic`: one button. */
    mode?: 'advanced' | 'basic';
    /** The form field name the files are sent under. Defaults to `'files[]'`. */
    name?: string;
    /** Where the files are posted. Leave it out with `customUpload`. */
    url?: string;
    multiple?: boolean;
    /** The `accept` attribute: `image/*`, `.pdf`… Files that do not match are refused with a message. */
    accept?: string;
    /** In bytes. Larger files are refused with a message. */
    maxFileSize?: number;
    /** How many files may be queued and uploaded in all. */
    fileLimit?: number;
    disabled?: boolean;
    /** Upload as soon as files are chosen. */
    auto?: boolean;
    /** Emit `uploader` with the files instead of posting them. */
    customUpload?: boolean;
    withCredentials?: boolean;
    /**
     * Post each file in a request of its own, each with its own progress bar;
     * a file leaves the queue as soon as its request succeeds. By default all
     * the queued files go in one request.
     */
    requestPerFile?: boolean;
    chooseLabel?: string;
    uploadLabel?: string;
    cancelLabel?: string;
    /** Defaults to true. */
    showUploadButton?: boolean;
    /** Defaults to true. */
    showCancelButton?: boolean;
    /** `{name}`, `{types}`. Defaults to the locale's. */
    invalidFileTypeMessage?: string;
    /** `{name}`, `{size}`. Defaults to the locale's. */
    invalidFileSizeMessage?: string;
    /** `{limit}`. Defaults to the locale's. */
    invalidFileLimitMessage?: string;
}

export interface FileUploadEvent {
    files: File[];
}

export type FileUploadEmits = {
    select: [event: FileUploadEvent & { originalEvent: Event }];
    'before-upload': [event: { xhr: XMLHttpRequest; formData: FormData }];
    /** `progress` is the whole upload's; with `requestPerFile`, `file` and `fileProgress` say which request moved. */
    progress: [event: { originalEvent: ProgressEvent; progress: number; file?: File; fileProgress?: number }];
    upload: [event: FileUploadEvent & { xhr: XMLHttpRequest }];
    error: [event: FileUploadEvent & { xhr: XMLHttpRequest }];
    /** With `customUpload`: upload these yourself. */
    uploader: [event: FileUploadEvent];
    remove: [event: { file: File; files: File[] }];
    clear: [];
};

export interface FileUploadSlots {
    /** Extra content in the toolbar. */
    header?: (props: { files: File[]; chooseCallback: () => void; uploadCallback: () => void; clearCallback: () => void }) => unknown;
    /** Replaces the queue. */
    content?: (props: { files: File[]; uploadedFiles: File[]; removeFileCallback: (index: number) => void; progress: number; messages: string[] }) => unknown;
    /** Shown while the queue is empty. */
    empty?: () => unknown;
}

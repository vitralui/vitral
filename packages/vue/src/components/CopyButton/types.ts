import type { BaseProps, Severity, Size } from '../../base/types';

export interface CopyButtonProps extends BaseProps {
    /** What is copied, or a function returning it (and it may wait). */
    value?: string | (() => string | Promise<string>);
    /** Without one the button shows only its icon, named "Copy". */
    label?: string;
    /** Shown in place of `label` for a moment once copied. */
    copiedLabel?: string;
    /** How long the tick stays, in milliseconds. Defaults to 2000. */
    timeout?: number;
    /** Defaults to `'secondary'`. */
    severity?: Severity;
    /** Defaults to `'text'`. */
    variant?: 'filled' | 'outlined' | 'text';
    size?: Size;
    rounded?: boolean;
    disabled?: boolean;
}

export type CopyButtonEmits = {
    copy: [value: string];
    error: [error: unknown];
};

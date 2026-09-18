import type { BaseProps, InputVariant, OverlayPlacement, Size } from '../../base/types';

export interface PasswordProps extends BaseProps {
    /** Show a strength meter while the box has focus. Defaults to true. */
    feedback?: boolean;
    /** Add a button that shows the password as plain text, and back. */
    toggleMask?: boolean;
    /** Shows a clear button while there is text. */
    clearable?: boolean;
    /** Shown in the meter before anything is typed. */
    promptLabel?: string;
    weakLabel?: string;
    mediumLabel?: string;
    strongLabel?: string;
    /** Met by a medium password, as a regular expression or its source. */
    mediumRegex?: string | RegExp;
    /** Met by a strong password, as a regular expression or its source. */
    strongRegex?: string | RegExp;
    size?: Size;
    /** Defaults to the plugin's `inputVariant`. */
    variant?: InputVariant;
    invalid?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    fluid?: boolean;
    placement?: OverlayPlacement;
    /** `'body'` (the default), `'self'` to render in place, or a selector. */
    appendTo?: string;
}

export type PasswordEmits = {
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
    clear: [];
};

export interface PasswordSlots {
    /** Above the meter. */
    header?: () => unknown;
    /** Below the meter — the rules a password has to follow. */
    footer?: () => unknown;
    /** Replaces the meter bar; the announced grade stays below it. */
    content?: (props: { strength: 'weak' | 'medium' | 'strong' | null; label: string }) => unknown;
    maskicon?: () => unknown;
    unmaskicon?: () => unknown;
}

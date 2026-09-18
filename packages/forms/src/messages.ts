/**
 * The texts the built-in rules produce. Placeholders are `{name}`. A view
 * layer passes its own (the Vue components pass the `form` group of the
 * Vitral locale, which has these same keys), and any key left out falls back
 * to English.
 */
export interface FormMessages {
    /** A required field left empty. */
    required: string;
    /** Text shorter than `minLength`. `{min}` */
    minLength: string;
    /** Text longer than `maxLength`. `{max}` */
    maxLength: string;
    /** A list with fewer items than `minLength`. `{min}` */
    minItems: string;
    /** A list with more items than `maxLength`. `{max}` */
    maxItems: string;
    /** A number or date below `min`. `{min}` */
    min: string;
    /** A number or date above `max`. `{max}` */
    max: string;
    /** Text that does not match `pattern`. */
    pattern: string;
    email: string;
    url: string;
    /** A value that has to repeat another field's. `{field}` */
    equals: string;
    /** A rule that returned `false` without a message of its own. */
    invalid: string;
}

export const defaultFormMessages: FormMessages = {
    required: 'This field is required.',
    minLength: 'Enter at least {min} characters.',
    maxLength: 'Enter no more than {max} characters.',
    minItems: 'Choose or add at least {min}.',
    maxItems: 'Choose or add no more than {max}.',
    min: 'Enter {min} or more.',
    max: 'Enter {max} or less.',
    pattern: 'Enter a value in the expected format.',
    email: 'Enter an email address like name@example.com.',
    url: 'Enter a web address like https://example.com.',
    equals: 'This has to match {field}.',
    invalid: 'Enter a valid value.'
};

/** Fills `{name}` placeholders; an unknown one is left as written. */
export function fillMessage(template: string, params: Record<string, unknown> = {}): string {
    return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in params ? formatParam(params[key]) : whole));
}

function formatParam(value: unknown): string {
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
}

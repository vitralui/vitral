import type { BaseProps } from '../../base/types';

// These types are written here rather than imported from @vitral/forms: the SFC
// compiler reads prop types, and it resolves relative files, not packages. They
// are the same shapes, so a `zodResolver(...)` or `rules.required()` from
// @vitral/forms fits them.

/** When a field is validated: on submit, when focus leaves it, when a value is committed, or on every input. */
export type FormValidateOn = 'submit' | 'blur' | 'change' | 'input';

/** A rule from `rules` (`rules.required()`, `rules.email()`…) or a function of your own: a message when the value is wrong. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormRuleLike = (value: any, context: any) => unknown;

/** A resolver (`zodResolver(schema)`, `functionResolver(fn)`…): validates every value at once. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormResolverLike = (values: any, context: any) => unknown;

/** Which attributes point a control at its error: `aria-describedby`, `aria-errormessage`, or both. */
export type FormErrorRelation = 'both' | 'describedby' | 'errormessage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormValuesLike = Record<string, any>;

export interface FormSubmitEvent<Values = FormValuesLike> {
    /** Whether every check passed. The handler runs either way; the save belongs behind `valid`. */
    valid: boolean;
    /** The values, as the resolver returned them when it transforms them. */
    values: Values;
    /** Messages by path. */
    errors: Record<string, string[]>;
    originalEvent?: Event;
    /** Reports errors from the server; the submit then counts as failed. */
    setErrors(errors: Record<string, unknown>): void;
    setError(path: string, message: string | readonly string[] | undefined): void;
    reset(values?: Values): void;
}

export interface FormInvalidSubmitEvent<Values = FormValuesLike> {
    values: Values;
    errors: Record<string, string[]>;
    originalEvent?: Event;
}

export interface FormResetEvent {
    originalEvent?: Event;
}

export interface FormRootProps extends BaseProps {
    /** The values to start from, and to go back to on reset. Defaults to a copy of v-model. */
    initialValues?: FormValuesLike;
    /** Validates the whole form: `zodResolver(schema)`, `yupResolver(schema)`, `functionResolver(fn)`… */
    resolver?: FormResolverLike;
    /** Checks across fields, beside the resolver: return messages by path. */
    validate?: (values: FormValuesLike, context: { signal: AbortSignal }) => unknown;
    /** Rules by path, for a form that declares them in one place. */
    rules?: Record<string, FormRuleLike | FormRuleLike[]>;
    /** When a field is first validated. Defaults to `submit`. A field can say otherwise. */
    validateOn?: FormValidateOn | FormValidateOn[];
    /** When a field that has been validated is validated again. Defaults to `input`, so an error clears as it is fixed. */
    revalidateOn?: FormValidateOn | FormValidateOn[];
    /** Milliseconds to wait after typing stops before an input-triggered validation. */
    debounce?: number;
    /** A form made with `useForm()`, to drive it from outside the template. */
    form?: object;
    /** After a failed submit, move focus to the error summary (when there is one) or to the first invalid field. Defaults to true. */
    focusOnInvalid?: boolean;
    /** Disables every control wired by a field, and the submit button. */
    disabled?: boolean;
    /** How a control points at its error. Defaults to `both`. */
    errorRelation?: FormErrorRelation;
}

export type FormRootEmits = {
    /** Every submit, with its values and whether they are valid. A handler returning a promise keeps the form submitting until it settles. */
    submit: [event: FormSubmitEvent];
    /** A submit stopped by errors. */
    'invalid-submit': [event: FormInvalidSubmitEvent];
    reset: [event: FormResetEvent];
};

export interface FormRootSlotProps {
    values: FormValuesLike;
    errors: Record<string, string[]>;
    valid: boolean;
    dirty: boolean;
    submitting: boolean;
    submitted: boolean;
    submitCount: number;
    validating: boolean;
    reset: (values?: FormValuesLike) => void;
    submit: () => Promise<unknown>;
    setValue: (path: string, value: unknown) => void;
}

export interface FormRootSlots {
    default?: (props: FormRootSlotProps) => unknown;
}

export interface FormFieldProps extends BaseProps {
    /** The path of the value: `email`, `address.city`, `items.0.title`. */
    name: string;
    /** The field's name for people: rendered as its label when there is no `Form.Label`, and used by the error summary. */
    label?: string;
    /** A hint, rendered under the label when there is no `Form.Description`. */
    description?: string;
    /** Rules for this field: `rules.required()`, `[rules.minLength(3), rules.email()]`, or functions of your own. */
    rules?: FormRuleLike | FormRuleLike[];
    /** Adds the required rule, the label's mark and `aria-required`. */
    required?: boolean;
    /** Overrides the form's `validateOn`. */
    validateOn?: FormValidateOn | FormValidateOn[];
    /** Overrides the form's `revalidateOn`. */
    revalidateOn?: FormValidateOn | FormValidateOn[];
    /** Milliseconds to wait after typing stops before validating, for async checks. */
    debounce?: number;
    /** Other paths whose changes validate this field again. */
    deps?: string[];
    /** A value for the path when the form has none. */
    initialValue?: unknown;
    /** The control's id; generated when neither this nor the control sets one. */
    id?: string;
    /** The element the field renders. Defaults to `div`. */
    as?: string;
    /** Render the error under the control when there is no `Form.Message`. Defaults to true. */
    message?: boolean;
    /** Wire the Vitral control placed inside (value, name, invalid, ARIA). Defaults to true; turn it off to bind through the slot. */
    autoBind?: boolean;
}

/** Attributes for a control of your own, from the field's slot: `v-bind="controlProps"`. */
export interface FormFieldControlProps {
    id: string;
    name: string;
    'aria-invalid'?: 'true';
    'aria-describedby'?: string;
    'aria-errormessage'?: string;
    'aria-required'?: 'true';
    'aria-labelledby'?: string;
}

export interface FormFieldSlotProps {
    value: unknown;
    /** Sets the value; `trigger` is `input` (typing) or `change` (a committed choice). */
    setValue: (value: unknown, trigger?: 'input' | 'change') => void;
    /** Alias of `setValue`, for `@update:model-value`. */
    onUpdate: (value: unknown) => void;
    /** Report that focus left the control (for `validateOn: 'blur'`). */
    onBlur: () => void;
    invalid: boolean;
    error: string | undefined;
    errors: string[];
    touched: boolean;
    dirty: boolean;
    validating: boolean;
    required: boolean;
    ids: { control: string; label: string; description: string; message: string };
    controlProps: FormFieldControlProps;
}

export interface FormFieldSlots {
    /** The label, the control and whatever else the field holds. */
    default?: (props: FormFieldSlotProps) => unknown;
}

export interface FormLabelProps extends BaseProps {
    /** Shows the required mark; defaults to whether the field is required. */
    required?: boolean;
}

export interface FormLabelSlots {
    /** The label text; defaults to the field's `label`. */
    default?: () => unknown;
}

export interface FormDescriptionProps extends BaseProps {
    /** The element rendered. Defaults to `p`. */
    as?: string;
}

export interface FormDescriptionSlots {
    default?: () => unknown;
}

export interface FormMessageProps extends BaseProps {
    /** Show every message of the field, not only the first. */
    all?: boolean;
    /** Hide the icon beside the message. */
    hideIcon?: boolean;
}

export interface FormMessageSlots {
    /** Replaces the message's content; rendered only while there is an error. */
    default?: (props: { error: string; errors: string[] }) => unknown;
}

export interface FormSummaryItem {
    /** The field's path. */
    name: string;
    label: string;
    message: string;
    /** The id of the control the entry links to, when the field is on the page. */
    target?: string;
}

export interface FormSummaryProps extends BaseProps {
    /** The heading; defaults to the locale's. */
    title?: string;
    /** The heading level. Defaults to 2. */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Show the summary whenever there are errors, not only after a failed submit. */
    always?: boolean;
    /** Take focus after a failed submit. Defaults to true. */
    autofocus?: boolean;
}

export interface FormSummarySlots {
    /** Replaces the heading's text. */
    title?: (props: { count: number }) => unknown;
    /** Content between the heading and the list. */
    default?: (props: { items: FormSummaryItem[] }) => unknown;
    /** Replaces one entry's content (inside its link). */
    item?: (props: { item: FormSummaryItem }) => unknown;
}

export interface FormSubmitProps extends BaseProps {
    /** The button text. Defaults to the slot. */
    label?: string;
    /** Disable the button while known errors remain. Off by default: a submit that explains what is wrong is kinder than a button that will not press. */
    disableInvalid?: boolean;
    /** Disable the button until something changed. */
    disablePristine?: boolean;
    disabled?: boolean;
}

export interface FormSubmitSlots {
    default?: (props: { submitting: boolean }) => unknown;
}

export interface FormResetProps extends BaseProps {
    label?: string;
    /** Disable the button until something changed. Defaults to false. */
    disablePristine?: boolean;
    disabled?: boolean;
}

export interface FormResetSlots {
    default?: () => unknown;
}

export interface FormFieldArrayItem<Item = unknown> {
    /** A stable key for `v-for`. */
    key: string;
    index: number;
    /** The item's path: `items.2`; a field inside is `${item.name}.title`. */
    name: string;
    value: Item;
    first: boolean;
    last: boolean;
}

export interface FormFieldArrayProps extends BaseProps {
    /** The path of the list. */
    name: string;
    /** The list's name for people, for the error summary. */
    label?: string;
    /** Rules for the list itself: `rules.minLength(1, 'Add a row.')`. */
    rules?: FormRuleLike | FormRuleLike[];
    validateOn?: FormValidateOn | FormValidateOn[];
    /** The element rendered. Defaults to `div`. */
    as?: string;
}

export interface FormFieldArraySlotProps<Item = unknown> {
    fields: FormFieldArrayItem<Item>[];
    append: (...items: Item[]) => void;
    prepend: (...items: Item[]) => void;
    insert: (index: number, ...items: Item[]) => void;
    remove: (index: number | number[]) => void;
    move: (from: number, to: number) => void;
    swap: (a: number, b: number) => void;
    replace: (items: Item[]) => void;
    error: string | undefined;
    invalid: boolean;
}

export interface FormFieldArraySlots {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default?: (props: FormFieldArraySlotProps<any>) => unknown;
}

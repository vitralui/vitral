import FormDescription from './FormDescription.vue';
import FormField from './FormField.vue';
import FormFieldArray from './FormFieldArray.vue';
import FormLabel from './FormLabel.vue';
import FormMessage from './FormMessage.vue';
import FormReset from './FormReset.vue';
import FormRoot from './FormRoot.vue';
import FormSubmit from './FormSubmit.vue';
import FormSummary from './FormSummary.vue';

/**
 * The form's parts, as one object: `<Form.Root>`, `<Form.Field>`,
 * `<Form.Label>`, `<Form.Message>`, `<Form.Summary>`, `<Form.Submit>`… Each is
 * also a named export (`FormRoot`, `FormField`…).
 *
 * `Form` itself is a plain object, not a component: `<form>` is an HTML
 * element, so a component registered as `Form` would clash with it. Register
 * the parts under their own names if you register them globally.
 */
export const Form = /* @__PURE__ */ Object.freeze({
    Root: FormRoot,
    Field: FormField,
    Label: FormLabel,
    Description: FormDescription,
    Message: FormMessage,
    Summary: FormSummary,
    /** The same part as `Summary`. */
    Errors: FormSummary,
    Submit: FormSubmit,
    Reset: FormReset,
    FieldArray: FormFieldArray
});

/** `Form.Errors`, by name: the error summary. */
const FormErrors = FormSummary;

export { FormRoot, FormField, FormLabel, FormDescription, FormMessage, FormSummary, FormErrors, FormSubmit, FormReset, FormFieldArray };
export { FormKey, FieldKey, type FormContext, type FieldContext, type FormFieldEntry } from './context';
export type * from './types';

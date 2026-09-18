import { computed, inject } from 'vue';
import { FieldKey } from '../components/Form/context';

/**
 * The field around a control of your own, inside `<Form.Field>`: its value
 * and how to set it, its state, and the attributes that tie the control to
 * the label, hint and error.
 *
 * ```ts
 * const field = useFormField();
 * // <input :value="field.value.value" v-bind="field.controlProps.value" @input="field.setValue($event.target.value, 'input')" @blur="field.onBlur" />
 * ```
 */
export function useFormField() {
    const ctx = inject(FieldKey, null);
    if (!ctx) throw new Error('useFormField() must be called in a component inside <FormField> (Form.Field).');
    const state = ctx.state;
    return {
        name: ctx.name,
        value: computed(() => state.value.value),
        setValue: ctx.setValue,
        onBlur: ctx.blur,
        focus: ctx.focus,
        invalid: computed(() => state.value.invalid),
        error: computed(() => (state.value.invalid ? state.value.error : undefined)),
        errors: computed(() => (state.value.invalid ? state.value.errors : [])),
        touched: computed(() => state.value.touched),
        dirty: computed(() => state.value.dirty),
        validating: computed(() => state.value.validating),
        required: computed(() => state.value.required),
        ids: ctx.ids,
        /** Spread on the control: id, name and the ARIA relations. */
        controlProps: computed(() => ({
            id: ctx.ids.control,
            name: ctx.name.value,
            'aria-invalid': state.value.invalid ? ('true' as const) : undefined,
            'aria-describedby': [ctx.parts.description || ctx.descriptionProp() ? ctx.ids.description : '', state.value.invalid ? ctx.ids.message : ''].filter(Boolean).join(' ') || undefined,
            'aria-errormessage': state.value.invalid ? ctx.ids.message : undefined,
            'aria-required': state.value.required ? ('true' as const) : undefined
        }))
    };
}

export type UseFormFieldReturn = ReturnType<typeof useFormField>;

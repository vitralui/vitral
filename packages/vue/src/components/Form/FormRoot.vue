<script setup lang="ts">
import { cloneValue, isEqual, type FormValues, type Resolver, type Rules } from '@vitral/forms';
import { formStyle } from '@vitral/styles';
import { callWithAsyncErrorHandling, computed, getCurrentInstance, provide, toRaw, watch, watchEffect } from 'vue';
import { useComponent } from '../../base/useComponent';
import { isFormHandle, useForm, type UseFormReturn } from '../../composables/useForm';
import { FormKey, type FormContext } from './context';
import type { FormRootEmits, FormRootProps, FormRootSlotProps, FormRootSlots, FormSubmitEvent, FormValuesLike } from './types';

// The form: a native <form novalidate> — the browser's own bubbles are
// replaced by the fields' messages and the summary — that owns the values and
// the validation its parts share. On a failed submit, focus moves to the error
// summary or to the first invalid field.

defineOptions({ name: 'VtFormRoot' });

const props = withDefaults(defineProps<FormRootProps>(), { unstyled: undefined, focusOnInvalid: true, disabled: false, errorRelation: 'both' });
const model = defineModel<FormValuesLike>();
const emit = defineEmits<FormRootEmits>();
defineSlots<FormRootSlots>();

const instance = getCurrentInstance();
const external = isFormHandle(props.form) ? (props.form as UseFormReturn) : null;
const handle: UseFormReturn =
    external ??
    useForm({
        initialValues: (props.initialValues ?? (model.value ? toRaw(model.value) : {})) as FormValues,
        resolver: props.resolver as Resolver | undefined,
        validate: props.validate as never,
        rules: props.rules as Record<string, Rules> | undefined,
        validateOn: props.validateOn,
        revalidateOn: props.revalidateOn,
        debounce: props.debounce
    });
const form = handle.form;
const { part } = useComponent(formStyle, props);

handle.setDisabled(() => props.disabled);
handle.setErrorRelation(() => props.errorRelation);
handle.setFocusOnInvalid(() => props.focusOnInvalid);
handle.setStyling(
    () => props.unstyled,
    () => props.pt
);

// Options follow the props; a form made by useForm() keeps its own unless a prop says otherwise.
watchEffect(() => {
    const next: Record<string, unknown> = {};
    const set = (key: string, value: unknown) => {
        if (!external || value !== undefined) next[key] = value;
    };
    set('resolver', props.resolver);
    set('validate', props.validate);
    set('rules', props.rules);
    set('validateOn', props.validateOn);
    set('revalidateOn', props.revalidateOn);
    set('debounce', props.debounce);
    form.setOptions(next);
});

watch(
    () => props.initialValues,
    (next, previous) => {
        if (next && !isEqual(toRaw(next), toRaw(previous))) handle.reset(cloneValue(toRaw(next)) as FormValues);
    },
    { deep: true }
);

// v-model: the form's values out, and changes made from outside back in.
if (external && model.value) form.setValues(cloneValue(toRaw(model.value)) as FormValues);
/** What the values were when they were last handed out, to catch a parent changing them in place. */
let handedOut: unknown;
watch(
    () => handle.state.value.values,
    (values) => {
        if (toRaw(model.value) === values) return;
        handedOut = cloneValue(values);
        model.value = values;
    }
);
watch(
    model,
    (value) => {
        if (!value) return;
        const raw = toRaw(value);
        if (raw === form.getValues() && isEqual(raw, handedOut)) return;
        form.setValues(cloneValue(raw) as FormValues);
    },
    { deep: true }
);

provide(FormKey, handle as unknown as FormContext);

function listeners(): ((event: FormSubmitEvent) => unknown)[] {
    const raw = instance?.vnode.props?.onSubmit as ((event: FormSubmitEvent) => unknown) | ((event: FormSubmitEvent) => unknown)[] | undefined;
    const list = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
    return list.map((fn) => (event: FormSubmitEvent) => callWithAsyncErrorHandling(fn, instance, 5, [event]));
}

function submit(event?: Event) {
    event?.preventDefault();
    return handle
        .submit(event, listeners() as never, (result) => emit('invalid-submit', { values: result.values, errors: result.errors, originalEvent: event }))
        .catch(() => undefined);
}

function onReset(event: Event) {
    event.preventDefault();
    handle.reset();
    emit('reset', { originalEvent: event });
}

const slotProps = computed<FormRootSlotProps>(() => {
    const state = handle.state.value;
    return {
        values: state.values,
        errors: state.errors,
        valid: state.valid,
        dirty: state.dirty,
        submitting: state.submitting,
        submitted: state.submitted,
        submitCount: state.submitCount,
        validating: state.validating,
        reset: (values) => handle.reset(values as FormValues | undefined),
        submit: () => submit(),
        setValue: (path, value) => form.setValue(path, value)
    };
});

defineExpose({
    form: handle,
    submit: () => submit(),
    reset: (values?: FormValuesLike) => handle.reset(values as FormValues | undefined),
    validate: () => form.validate(),
    setErrors: (errors: Record<string, unknown>) => form.setErrors(errors as never),
    getValues: () => form.getValues()
});
</script>

<template>
    <form novalidate v-bind="part('root')" @submit="submit" @reset="onReset">
        <slot v-bind="slotProps" />
    </form>
</template>

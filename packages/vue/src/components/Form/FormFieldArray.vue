<script setup lang="ts">
import type { FieldOptions, Rule } from '@vitral/forms';
import { formStyle } from '@vitral/styles';
import { computed, onBeforeUnmount, provide, reactive, ref, useId, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import { FieldKey, inheritRoot, useFormContext, type FieldContext } from './context';
import type { FormFieldArrayItem, FormFieldArrayProps, FormFieldArraySlotProps, FormFieldArraySlots } from './types';
import { focusInside } from './wire';

// A list of repeated groups. The slot gets one entry per item — a stable key,
// the index and the item's path, under which its fields are named — and the
// operations that change the list; errors and state travel with the items.
// Rules on the list itself (at least one row) show in a Form.Message placed
// directly inside.

defineOptions({ name: 'VtFormFieldArray' });

const props = withDefaults(defineProps<FormFieldArrayProps>(), { unstyled: undefined, as: 'div' });
defineSlots<FormFieldArraySlots>();

const form = useFormContext('FormFieldArray');
const styled = inheritRoot(props, form);
const { part } = useComponent(formStyle, styled);
const uid = useId();
const rootRef = ref<HTMLElement | null>(null);
const parts = reactive({ label: 0, description: 0, message: 0 });

const ids = { control: `${uid}-list`, label: `${uid}-label`, description: `${uid}-description`, message: `${uid}-message` };
const state = computed(() => form.fieldState(props.name));
const api = computed(() => form.form.array(props.name));

const options = computed<FieldOptions>(() => ({
    rules: (props.rules === undefined ? [] : Array.isArray(props.rules) ? props.rules : [props.rules]) as Rule[],
    validateOn: props.validateOn,
    label: () => props.label
}));
let registration = form.form.register(props.name, options.value);
watch(options, (next) => registration.update(next));
watch(
    () => props.name,
    (name) => {
        registration.unregister();
        registration = form.form.register(name, options.value);
    }
);

function focus() {
    focusInside(rootRef.value);
}

const unregisterEntry = form.registerEntry({ name: () => props.name, element: () => rootRef.value, controlId: () => ids.control, label: () => props.label ?? props.name, focus });

onBeforeUnmount(() => {
    registration.unregister();
    unregisterEntry();
});

const fields = computed<FormFieldArrayItem[]>(() => {
    const value = state.value.value;
    const list = Array.isArray(value) ? value : [];
    const keys = api.value.keys();
    return list.map((item, index) => ({ key: keys[index]!, index, name: `${props.name}.${index}`, value: item, first: index === 0, last: index === list.length - 1 }));
});

const change = () => form.release(props.name);

const slotProps = computed<FormFieldArraySlotProps>(() => ({
    fields: fields.value,
    append: (...items) => (change(), api.value.append(...items)),
    prepend: (...items) => (change(), api.value.prepend(...items)),
    insert: (index, ...items) => (change(), api.value.insert(index, ...items)),
    remove: (index) => (change(), api.value.remove(index)),
    move: (from, to) => (change(), api.value.move(from, to)),
    swap: (a, b) => (change(), api.value.swap(a, b)),
    replace: (items) => (change(), api.value.replace(items)),
    error: state.value.invalid ? state.value.error : undefined,
    invalid: state.value.invalid
}));

const hasMessage = computed(() => parts.message > 0);

const context: FieldContext = {
    name: computed(() => props.name),
    state,
    ids,
    labelText: () => props.label ?? props.name,
    labelProp: () => props.label,
    descriptionProp: () => undefined,
    labelable: ref(false),
    group: ref(true),
    parts,
    registerPart(kind) {
        parts[kind]++;
        return () => parts[kind]--;
    },
    quiet: computed(() => form.quiet.value.has(props.name)),
    focus,
    setValue: (value, trigger = 'change') => {
        change();
        form.form.setValue(props.name, value, { trigger });
    },
    blur: () => void form.form.blur(props.name),
    unstyled: () => styled.unstyled,
    pt: () => styled.pt
};
provide(FieldKey, context);

defineExpose({
    append: (...items: unknown[]) => api.value.append(...items),
    remove: (index: number | number[]) => api.value.remove(index),
    move: (from: number, to: number) => api.value.move(from, to)
});
</script>

<template>
    <component
        :is="as"
        :id="ids.control"
        ref="rootRef"
        role="group"
        :aria-labelledby="parts.label ? ids.label : undefined"
        :aria-label="!parts.label ? label : undefined"
        :aria-describedby="state.invalid && hasMessage ? ids.message : undefined"
        :aria-invalid="state.invalid ? 'true' : undefined"
        :data-field="name"
        v-bind="part('fieldArray', { invalid: state.invalid })"
    >
        <slot v-bind="slotProps" />
    </component>
</template>

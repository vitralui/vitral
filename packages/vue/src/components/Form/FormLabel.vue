<script setup lang="ts">
import { formStyle } from '@vitral/styles';
import { computed, getCurrentInstance, mergeProps, onBeforeUnmount, ref } from 'vue';
import { useComponent } from '../../base/useComponent';
import Label from '../Label/Label.vue';
import { inheritRoot, isAutoPart, useFieldContext } from './context';
import type { FormLabelProps, FormLabelSlots } from './types';

// The field's label: a <label for> when the control is a native one, and
// otherwise the element the control (or the group) is labelled by, which
// still moves focus to the control when pressed.

defineOptions({ name: 'VtFormLabel' });

const props = withDefaults(defineProps<FormLabelProps>(), { unstyled: undefined, required: undefined });
defineSlots<FormLabelSlots>();

const field = useFieldContext('FormLabel');
const styled = inheritRoot(props, field);
const { part } = useComponent(formStyle, styled);
const labelRef = ref<InstanceType<typeof Label> | null>(null);

if (!isAutoPart(getCurrentInstance()?.vnode.key)) {
    onBeforeUnmount(field.registerPart('label', () => (labelRef.value?.$el as HTMLElement | undefined) ?? null));
}

const target = computed(() => (field.labelable.value && !field.group.value ? field.ids.control : undefined));
const required = computed(() => props.required ?? field.state.value.required);

function onClick(event: MouseEvent) {
    if (target.value) return;
    event.preventDefault();
    field.focus();
}
</script>

<template>
    <Label ref="labelRef" v-bind="mergeProps(part('label'), { id: field.ids.label })" :for="target" :required="required" :unstyled="styled.unstyled" @click="onClick">
        <slot>{{ field.labelProp() }}</slot>
    </Label>
</template>

<script setup lang="ts">
import { formStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import Button from '../Button/Button.vue';
import { inheritRoot, useFormContext } from './context';
import type { FormSubmitProps, FormSubmitSlots } from './types';

// The form's submit button: busy while the submit handler runs. Every other
// attribute (severity, icon, size…) reaches the Button.

defineOptions({ name: 'VtFormSubmit' });

const props = withDefaults(defineProps<FormSubmitProps>(), { unstyled: undefined, disableInvalid: false, disablePristine: false, disabled: false });
defineSlots<FormSubmitSlots>();

const form = useFormContext('FormSubmit');
const styled = inheritRoot(props, form);
const { part } = useComponent(formStyle, styled);
const state = form.state;

const disabled = computed(() => props.disabled || form.disabled.value || (props.disableInvalid && !state.value.valid) || (props.disablePristine && !state.value.dirty));
</script>

<template>
    <Button type="submit" :label="label" :loading="state.submitting" :disabled="disabled" :unstyled="styled.unstyled" v-bind="part('submit')">
        <template v-if="$slots.default" #default>
            <slot :submitting="state.submitting" />
        </template>
    </Button>
</template>

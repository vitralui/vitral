<script setup lang="ts">
import { formStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import Button from '../Button/Button.vue';
import { inheritRoot, useFormContext } from './context';
import type { FormResetProps, FormResetSlots } from './types';

// A reset button: the form goes back to its initial values, with every error cleared.

defineOptions({ name: 'VtFormReset' });

const props = withDefaults(defineProps<FormResetProps>(), { unstyled: undefined, disablePristine: false, disabled: false });
defineSlots<FormResetSlots>();

const form = useFormContext('FormReset');
const styled = inheritRoot(props, form);
const { part } = useComponent(formStyle, styled);
const state = form.state;

const disabled = computed(() => props.disabled || form.disabled.value || state.value.submitting || (props.disablePristine && !state.value.dirty));
</script>

<template>
    <Button type="reset" severity="secondary" variant="outlined" :label="label" :disabled="disabled" :unstyled="styled.unstyled" v-bind="part('reset')">
        <template v-if="$slots.default" #default>
            <slot />
        </template>
    </Button>
</template>

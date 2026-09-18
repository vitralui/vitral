<script setup lang="ts">
import { buttongroupStyle } from '@vitral/styles';
import { useComponent } from '../../base/useComponent';
import type { ButtonGroupProps, ButtonGroupSlots } from './types';

// A role="group" around buttons that belong together. Name it with
// `aria-label` or `aria-labelledby`; each button stays its own tab stop, as
// the buttons of a native group are.

defineOptions({ name: 'VtButtonGroup' });

const props = withDefaults(defineProps<ButtonGroupProps>(), { unstyled: undefined, orientation: 'horizontal' });
defineSlots<ButtonGroupSlots>();

const { part } = useComponent(buttongroupStyle, props);
</script>

<template>
    <div role="group" :aria-orientation="orientation === 'vertical' ? 'vertical' : undefined" v-bind="part('root', { orientation })">
        <slot />
    </div>
</template>

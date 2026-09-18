<script setup lang="ts">
import { toCssLength } from '@vitral/core';
import { stackpanelStyle } from '@vitral/styles';
import { computed, mergeProps } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { StackPanelProps, StackPanelSlots } from './types';

defineOptions({ name: 'VtStackPanel' });

const props = withDefaults(defineProps<StackPanelProps>(), { unstyled: undefined, orientation: 'vertical', as: 'div' });
defineSlots<StackPanelSlots>();

const { part } = useComponent(stackpanelStyle, props);

const state = computed(() => ({ orientation: props.orientation, wrap: props.wrap }));

// Inline, so the panel lays out the same unstyled; the spacing falls back to its token.
const layout = computed(() => ({
    display: 'flex',
    flexDirection: props.orientation === 'horizontal' ? 'row' : 'column',
    flexWrap: props.wrap ? 'wrap' : undefined,
    gap: toCssLength(props.spacing) ?? 'var(--vt-stackpanel-spacing)',
    alignItems: props.align,
    justifyContent: props.justify
}));
</script>

<template>
    <component :is="as" v-bind="mergeProps({ style: layout }, part('root', state))">
        <slot />
    </component>
</template>

<script setup lang="ts">
import { toCssLength } from '@vitral/core';
import { wrappanelStyle } from '@vitral/styles';
import { computed, mergeProps } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { WrapPanelProps, WrapPanelSlots } from './types';

defineOptions({ name: 'VtWrapPanel' });

const props = withDefaults(defineProps<WrapPanelProps>(), { unstyled: undefined, orientation: 'horizontal', as: 'div' });
defineSlots<WrapPanelSlots>();

const { part } = useComponent(wrappanelStyle, props);

const itemWidth = computed(() => toCssLength(props.itemWidth));
const itemHeight = computed(() => toCssLength(props.itemHeight));

const state = computed(() => ({ orientation: props.orientation, itemWidth: !!itemWidth.value, itemHeight: !!itemHeight.value }));

// The flow is inline, so it survives `unstyled`. Lines pack at the start, as
// a desktop wrap panel's do, instead of stretching across a taller panel. The item sizes
// are custom properties the stylesheet's child rules read.
const layout = computed(() => ({
    display: 'flex',
    flexDirection: props.orientation === 'vertical' ? 'column' : 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    gap: toCssLength(props.spacing) ?? 'var(--vt-wrappanel-spacing)',
    '--vt-wrappanel-item-width': itemWidth.value,
    '--vt-wrappanel-item-height': itemHeight.value
}));
</script>

<template>
    <component :is="as" v-bind="mergeProps({ style: layout }, part('root', state))">
        <slot />
    </component>
</template>

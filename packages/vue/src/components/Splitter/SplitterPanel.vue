<script setup lang="ts">
import { splitterpanelStyle } from '@vitral/styles';
import { useComponent } from '../../base/useComponent';
import type { SplitterPanelProps, SplitterPanelSlots } from './types';

// The Splitter reads `size` and `minSize` from this panel's vnode and hands it
// its id and its flex basis; the panel itself only renders.

defineOptions({ name: 'VtSplitterPanel' });

const props = withDefaults(defineProps<SplitterPanelProps>(), { unstyled: undefined, as: 'div' });
defineSlots<SplitterPanelSlots>();

const { part } = useComponent(splitterpanelStyle, props);
</script>

<template>
    <component :is="as" v-bind="part('root')">
        <slot />
    </component>
</template>

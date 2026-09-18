<script setup lang="ts">
import { aspectratioStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { AspectRatioProps, AspectRatioSlots } from './types';

// A box that keeps a ratio as its width changes, using CSS `aspect-ratio` set
// inline so it holds unstyled too. Pure layout: whatever is inside keeps its
// own semantics, and an image inside still needs its `alt`.

defineOptions({ name: 'VtAspectRatio' });

const props = withDefaults(defineProps<AspectRatioProps>(), { unstyled: undefined, ratio: 1 });
defineSlots<AspectRatioSlots>();

const { part } = useComponent(aspectratioStyle, props);
const style = computed(() => ({ aspectRatio: String(props.ratio > 0 && Number.isFinite(props.ratio) ? props.ratio : 1) }));
</script>

<template>
    <div v-bind="part('root')" :style="style">
        <slot />
    </div>
</template>

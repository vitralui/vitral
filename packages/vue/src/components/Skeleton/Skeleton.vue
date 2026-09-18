<script setup lang="ts">
import { skeletonStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { SkeletonProps } from './types';

// A skeleton says nothing: it stands in for content that has not arrived, and
// the thing that announces the wait is the region's own `aria-busy`. So it is
// hidden from assistive technology rather than described to it.

defineOptions({ name: 'VtSkeleton' });

const props = withDefaults(defineProps<SkeletonProps>(), { unstyled: undefined, shape: 'rectangle', animated: true });

const { part } = useComponent(skeletonStyle, props);

const state = computed(() => ({ shape: props.shape, animated: props.animated }));
const size = computed(() => ({
    width: props.width,
    height: props.height ?? (props.shape === 'circle' ? props.width : undefined),
    borderRadius: props.borderRadius
}));
</script>

<template>
    <div aria-hidden="true" :style="size" v-bind="part('root', state)" />
</template>

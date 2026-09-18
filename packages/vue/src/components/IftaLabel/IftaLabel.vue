<script setup lang="ts">
import { iftalabelStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { IftaLabelProps, IftaLabelSlots } from './types';

// The infield top-aligned label: it sits inside the field, above the value,
// and stays there — no movement to follow, and room made by the field itself.

defineOptions({ name: 'VtIftaLabel' });

const props = withDefaults(defineProps<IftaLabelProps>(), { unstyled: undefined });
defineSlots<IftaLabelSlots>();

const { part } = useComponent(iftalabelStyle, props);
const state = computed(() => ({ invalid: props.invalid }));
</script>

<template>
    <div v-bind="part('root', state)">
        <slot />
    </div>
</template>

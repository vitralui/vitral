<script setup lang="ts">
import { badgeStyle } from '@vitral/styles';
import { computed, useSlots } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { BadgeProps, BadgeSlots } from './types';

defineOptions({ name: 'VtBadge' });

const props = withDefaults(defineProps<BadgeProps>(), { unstyled: undefined, severity: 'primary', value: undefined });
defineSlots<BadgeSlots>();
const slots = useSlots();

const { part } = useComponent(badgeStyle, props);

const dot = computed(() => (props.value === undefined || props.value === null || props.value === '') && !slots.default);
const state = computed(() => ({ severity: props.severity, size: props.size, dot: dot.value }));
</script>

<template>
    <span v-bind="part('root', state)">
        <slot>{{ value }}</slot>
    </span>
</template>

<script setup lang="ts">
import { emptystateStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { EmptyStateProps, EmptyStateSlots } from './types';

defineOptions({ name: 'VtEmptyState' });

const props = withDefaults(defineProps<EmptyStateProps>(), { unstyled: undefined, icon: undefined, align: 'center' });
const slots = defineSlots<EmptyStateSlots>();

const { part } = useComponent(emptystateStyle, props);

const severityIcons = { success: 'success', info: 'info', warn: 'warning', danger: 'error' } as const;
const icon = computed(() => (props.icon === false ? null : (props.icon ?? (props.severity ? severityIcons[props.severity] : 'inbox'))));
const state = computed(() => ({ size: props.size, severity: props.severity, align: props.align }));
const heading = computed(() => (props.headingLevel ? `h${props.headingLevel}` : 'p'));
</script>

<template>
    <div v-bind="part('root', state)">
        <span v-if="slots.icon || icon" aria-hidden="true" v-bind="part('icon')">
            <slot name="icon"><Icon :icon="icon!" /></slot>
        </span>
        <component :is="heading" v-if="slots.title || title" v-bind="part('title')">
            <slot name="title">{{ title }}</slot>
        </component>
        <p v-if="slots.default || description" v-bind="part('description')">
            <slot>{{ description }}</slot>
        </p>
        <div v-if="slots.actions" v-bind="part('actions')">
            <slot name="actions" />
        </div>
    </div>
</template>

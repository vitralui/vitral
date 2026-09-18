<script setup lang="ts">
import { toPercent } from '@vitral/core';
import { progressbarStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { ProgressBarProps, ProgressBarSlots } from './types';

// A WAI-ARIA progressbar: value, minimum and maximum while determinate, no
// value at all while indeterminate. Name it with `aria-label` or
// `aria-labelledby`; the visible label is decoration for sighted users.

defineOptions({ name: 'VtProgressBar' });

const props = withDefaults(defineProps<ProgressBarProps>(), { unstyled: undefined, value: 0, mode: 'determinate', showValue: true, unit: '%' });
defineSlots<ProgressBarSlots>();

const { part } = useComponent(progressbarStyle, props);

const indeterminate = computed(() => props.mode === 'indeterminate');
const percent = computed(() => toPercent(props.value));
const rounded = computed(() => Math.round(percent.value));
</script>

<template>
    <div
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="indeterminate ? undefined : rounded"
        :aria-valuetext="indeterminate || unit === '%' ? undefined : `${rounded}${unit}`"
        v-bind="part('root', { indeterminate })"
    >
        <div v-bind="part('track')">
            <div v-bind="part('value')" :style="indeterminate ? undefined : { width: `${percent}%` }" />
        </div>
        <div v-if="showValue && !indeterminate" v-bind="part('label')">
            <slot :value="rounded">{{ rounded }}{{ unit }}</slot>
        </div>
    </div>
</template>

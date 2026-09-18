<script setup lang="ts">
import { toPercent } from '@vitral/core';
import { progressspinnerStyle } from '@vitral/styles';
import { computed, useAttrs } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { ProgressSpinnerProps } from './types';

// The ring as a WAI-ARIA progressbar, named "Loading…" from the
// locale unless given a name of its own; a value makes it determinate.

defineOptions({ name: 'VtProgressSpinner' });

const props = withDefaults(defineProps<ProgressSpinnerProps>(), { unstyled: undefined, strokeWidth: 3, value: undefined });
const attrs = useAttrs();

const { part, locale } = useComponent(progressspinnerStyle, props);

const determinate = computed(() => props.value !== undefined && props.value !== null);
const percent = computed(() => (determinate.value ? toPercent(props.value!) : 0));
const radius = computed(() => (32 - Math.min(Math.max(props.strokeWidth, 0.5), 15)) / 2);
const label = computed(() => (attrs['aria-labelledby'] ? undefined : ((attrs['aria-label'] as string | undefined) ?? locale.value.loading)));

const rootStyle = computed(() => {
    const style: Record<string, string> = {};
    if (props.size !== undefined) style.width = style.height = typeof props.size === 'number' ? `${props.size}px` : props.size;
    if (props.animationDuration) style['--vt-progressspinner-animation-duration'] = props.animationDuration;
    if (determinate.value) style['--_value'] = String(percent.value);
    return style;
});
</script>

<template>
    <div
        role="progressbar"
        :aria-label="label"
        :aria-valuemin="determinate ? 0 : undefined"
        :aria-valuemax="determinate ? 100 : undefined"
        :aria-valuenow="determinate ? Math.round(percent) : undefined"
        v-bind="part('root', { determinate })"
        :style="rootStyle"
    >
        <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" v-bind="part('svg')">
            <circle v-if="determinate" cx="16" cy="16" :r="radius" :stroke-width="strokeWidth" pathLength="100" v-bind="part('track')" />
            <circle cx="16" cy="16" :r="radius" :stroke-width="strokeWidth" pathLength="100" v-bind="part('circle')" />
        </svg>
    </div>
</template>

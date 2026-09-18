<script setup lang="ts">
import { toPercent } from '@vitral/core';
import { metergroupStyle } from '@vitral/styles';
import { computed, mergeProps } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { MeterGroupProps, MeterGroupSlots } from './types';

// One WAI-ARIA meter for the whole: its value is the total, and its value text
// lists every part ("Apps 16%, Media 8%…"), so a screen reader hears what the
// coloured segments show. The segments are drawing; the legend is text. Name
// the meter with `aria-label` or `aria-labelledby`.

defineOptions({ name: 'VtMeterGroup', inheritAttrs: false });

const props = withDefaults(defineProps<MeterGroupProps>(), {
    unstyled: undefined,
    value: () => [],
    min: 0,
    max: 100,
    orientation: 'horizontal',
    labelPosition: 'end',
    valueTemplate: '{value}%'
});
defineSlots<MeterGroupSlots>();

const { part } = useComponent(metergroupStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();

const percent = (value: number) => Math.round(toPercent(value, props.min, props.max));
const percentages = computed(() => props.value.map((item) => percent(item.value)));
const total = computed(() => props.value.reduce((sum, item) => sum + item.value, 0));
const totalPercent = computed(() => Math.min(100, percentages.value.reduce((sum, p) => sum + p, 0)));
const write = (value: number) => props.valueTemplate.replace(/\{value\}/g, String(value));
const colorOf = (index: number) => props.value[index]?.color ?? `var(--vt-chart-${(index % 8) + 1})`;
const valueText = computed(() => props.value.map((item, i) => `${item.label} ${write(percentages.value[i]!)}`).join(', '));
const vertical = computed(() => props.orientation === 'vertical');
const labelOrientation = computed(() => props.labelOrientation ?? (vertical.value ? 'vertical' : 'horizontal'));
const segmentStyle = (index: number) => ({ background: colorOf(index), [vertical.value ? 'height' : 'width']: `${percentages.value[index]}%` });
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root', { orientation, labelPosition }))">
        <slot name="start" :total-percent="totalPercent" />
        <div
            role="meter"
            :aria-valuemin="min"
            :aria-valuemax="max"
            :aria-valuenow="Math.min(max, total)"
            :aria-valuetext="valueText || undefined"
            v-bind="controlAttrs"
        >
            <div v-bind="part('track')">
                <span v-for="(item, i) in value" :key="item.label" aria-hidden="true" v-bind="part('meter')" :style="segmentStyle(i)" />
            </div>
        </div>
        <slot name="label" :value="value" :total-percent="totalPercent" :percentages="percentages">
            <ul v-if="value.length" v-bind="part('labels', { orientation: labelOrientation })">
                <li v-for="(item, i) in value" :key="item.label" v-bind="part('label')">
                    <slot name="icon" :value="item" :index="i">
                        <Icon v-if="item.icon" :icon="item.icon" v-bind="part('icon')" :style="{ color: colorOf(i) }" />
                        <span v-else aria-hidden="true" v-bind="part('marker')" :style="{ background: colorOf(i) }" />
                    </slot>
                    <span v-bind="part('text')">{{ item.label }}</span>
                    <span v-bind="part('value')">{{ write(percentages[i]!) }}</span>
                </li>
            </ul>
        </slot>
        <slot name="end" :total-percent="totalPercent" />
    </div>
</template>

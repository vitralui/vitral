<script setup lang="ts">
import { formatMessage } from '@vitral/core';
import { statStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { StatProps, StatSlots } from './types';

defineOptions({ name: 'VtStat' });

const props = withDefaults(defineProps<StatProps>(), { unstyled: undefined });
const slots = defineSlots<StatSlots>();

const { part, locale } = useComponent(statStyle, props);

const formatted = computed(() => {
    if (props.value === undefined || props.value === null) return '';
    if (typeof props.value === 'string') return props.value;
    return new Intl.NumberFormat(locale.value.code, props.format).format(props.value);
});

const trend = computed<'up' | 'down' | 'neutral'>(() => {
    if (props.trend) return props.trend;
    if (typeof props.delta !== 'number' || props.delta === 0) return 'neutral';
    return props.delta > 0 ? 'up' : 'down';
});

const deltaText = computed(() => {
    if (props.delta === undefined || props.delta === null) return '';
    if (typeof props.delta === 'string') return props.delta;
    const options: Intl.NumberFormatOptions = props.deltaFormat ?? { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' };
    return new Intl.NumberFormat(locale.value.code, options).format(props.delta);
});

// The arrow and the colour are not read out, so the change is said in words:
// "Up 12.5%", with the sign dropped because the word already carries it.
const deltaSpoken = computed(() => {
    const plain = deltaText.value.replace(/^[+−-]/, '');
    if (trend.value === 'up') return formatMessage(locale.value.aria.increase, { value: plain });
    if (trend.value === 'down') return formatMessage(locale.value.aria.decrease, { value: plain });
    return deltaText.value;
});

const deltaState = computed(() => ({ trend: trend.value, good: trend.value === 'up' ? !props.invert : trend.value === 'down' ? props.invert : false }));
const trendIcon = computed(() => (trend.value === 'up' ? 'trendingUp' : trend.value === 'down' ? 'trendingDown' : 'minus'));
</script>

<template>
    <div v-bind="part('root', { size, loading })" :aria-busy="loading || undefined">
        <div v-if="label || icon || slots.label || slots.icon" v-bind="part('header')">
            <span v-if="icon || slots.icon" aria-hidden="true" v-bind="part('icon')">
                <slot name="icon"><Icon :icon="icon!" /></slot>
            </span>
            <span v-bind="part('label')"><slot name="label">{{ label }}</slot></span>
        </div>
        <div v-bind="part('body')">
            <span v-bind="part('value')">
                <span v-if="loading" v-bind="part('placeholder')" />
                <template v-else>
                    <span v-if="prefix" v-bind="part('prefix')">{{ prefix }}</span>
                    <slot name="value" :value="formatted">{{ formatted }}</slot>
                    <span v-if="suffix" v-bind="part('suffix')">{{ suffix }}</span>
                </template>
            </span>
            <span v-if="deltaText && !loading" v-bind="part('delta', deltaState)">
                <Icon :icon="trendIcon" />
                <span aria-hidden="true">{{ deltaText }}</span>
                <span class="vt-sr-only">{{ deltaSpoken }}</span>
            </span>
            <span v-if="caption || slots.caption" v-bind="part('caption')"><slot name="caption">{{ caption }}</slot></span>
        </div>
        <div v-if="slots.chart" v-bind="part('chart')"><slot name="chart" /></div>
    </div>
</template>

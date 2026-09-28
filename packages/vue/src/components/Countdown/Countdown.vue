<script setup lang="ts">
import { countdownParts } from '@vitral/core';
import { countdownStyle } from '@vitral/styles';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { CountdownEmits, CountdownProps, CountdownSlots, CountdownUnit } from './types';

defineOptions({ name: 'VtCountdown' });

const props = withDefaults(defineProps<CountdownProps>(), { unstyled: undefined, variant: 'tiles', hideLeadingZeros: true });
const emit = defineEmits<CountdownEmits>();
defineSlots<CountdownSlots>();

const { part, locale } = useComponent(countdownStyle, props);

const target = computed(() => new Date(props.to).getTime());
// The server and the first paint agree on "now" being the moment the page was made; the clock starts once mounted.
const now = ref(Date.now());
const units = computed<CountdownUnit[]>(() => props.units ?? ['days', 'hours', 'minutes', 'seconds']);
const left = computed(() => countdownParts(target.value - now.value, units.value));

const SINGULAR: Record<CountdownUnit, 'day' | 'hour' | 'minute' | 'second'> = { days: 'day', hours: 'hour', minutes: 'minute', seconds: 'second' };
const words = (unit: CountdownUnit, value: number, display: 'long' | 'short' = 'long') =>
    new Intl.NumberFormat(locale.value.code, { style: 'unit', unit: SINGULAR[unit], unitDisplay: display }).format(value);
/** A unit's name alone, as the locale writes it for this value: "days", "dias". */
const unitName = (unit: CountdownUnit, value: number) =>
    new Intl.NumberFormat(locale.value.code, { style: 'unit', unit: SINGULAR[unit], unitDisplay: 'long' })
        .formatToParts(value)
        .filter((p) => p.type === 'unit')
        .map((p) => p.value)
        .join('')
        .trim();

const shown = computed(() => {
    const list = units.value.map((unit) => ({ unit, value: left.value[unit] }));
    if (!props.hideLeadingZeros) return list;
    const first = list.findIndex((part) => part.value > 0);
    // Always the last unit at least, so a finished countdown still says 0.
    return list.slice(first < 0 ? list.length - 1 : first);
});
const pad = (unit: CountdownUnit, value: number) => (unit === units.value[0] ? String(value) : String(value).padStart(2, '0'));
const spoken = computed(() => shown.value.map((p) => words(p.unit, p.value)).join(', '));

let timer: ReturnType<typeof setInterval> | undefined;
function tick() {
    now.value = Date.now();
    if (left.value.done) {
        stop();
        emit('end');
    }
}
function start() {
    stop();
    if (props.paused || left.value.done) return;
    // On the second, so every tile changes together with the wall clock.
    timer = setInterval(tick, 1000);
}
function stop() {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
}

onMounted(() => {
    now.value = Date.now();
    start();
});
onBeforeUnmount(stop);
watch(() => [props.to, props.paused], () => {
    now.value = Date.now();
    start();
});
</script>

<template>
    <span v-bind="part('root', { variant, done: left.done })" role="timer" :aria-label="spoken">
        <slot v-bind="left">
            <template v-if="variant === 'text'">
                <span aria-hidden="true">{{ spoken }}</span>
            </template>
            <template v-else>
                <span v-for="p in shown" :key="p.unit" aria-hidden="true" v-bind="part('tile')">
                    <span v-bind="part('value')">{{ pad(p.unit, p.value) }}</span>
                    <span v-bind="part('label')">{{ unitName(p.unit, p.value) }}</span>
                </span>
            </template>
        </slot>
    </span>
</template>

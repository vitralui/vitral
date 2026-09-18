<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DatePicker',
    category: 'Form',
    description:
        "Type a date or pick one from a calendar. It follows the WAI-ARIA date picker dialog: the button opens a modal calendar grid; arrows move by day and week, Home/End to the ends of the week, PageUp/PageDown by month (Shift for a year), Enter or Space chooses, Escape closes. Typed text is read on blur or Enter in the locale's format; text that is not a date reverts."
};
</script>

<script setup lang="ts">
import { DatePicker } from '@vitral/vue';
import { computed, ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const today = new Date();
const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const plus = (days: number) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + days);

const date = ref<Date | null>(null);
const iso = ref<Date | null>(plus(3));
const booking = ref<Date | null>(null);
const footer = ref<Date | null>(start);
const inline = ref<Date | null>(plus(2));
const holidays = [plus(4), plus(5)];

const shown = (value: Date | null) => (value ? value.toDateString() : 'null');
const inlineText = computed(() => shown(inline.value));
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field">
            <label for="dp-basic">Date</label>
            <DatePicker id="dp-basic" v-model="date" placeholder="Pick a date" aria-describedby="dp-basic-hint" />
            <span id="dp-basic-hint" class="demo-hint">Format from the locale · value: {{ shown(date) }}</span>
        </div>
        <div class="demo-field">
            <label for="dp-iso">ISO format, weeks from Monday</label>
            <DatePicker id="dp-iso" v-model="iso" date-format="yyyy-MM-dd" :first-day-of-week="1" />
        </div>
    </DemoSection>
    <DemoSection title="Constraints" description="Only the next 30 days, no weekends, and two blocked days. Unselectable days are skipped by the keys and cannot be clicked or typed.">
        <div class="demo-field">
            <label for="dp-booking">Delivery</label>
            <DatePicker id="dp-booking" v-model="booking" :min-date="start" :max-date="plus(30)" :disabled-days="[0, 6]" :disabled-dates="holidays" placeholder="Choose a weekday" />
        </div>
    </DemoSection>
    <DemoSection title="Footer buttons">
        <div class="demo-field">
            <label for="dp-footer">Due</label>
            <DatePicker id="dp-footer" v-model="footer" show-today-button show-clear-button />
        </div>
    </DemoSection>
    <DemoSection title="Inline" description="The calendar on its own, without the field.">
        <div class="demo-field">
            <span id="dp-inline-label">Pick-up day</span>
            <DatePicker v-model="inline" inline show-today-button show-clear-button aria-labelledby="dp-inline-label" />
            <span class="demo-hint">Value: {{ inlineText }}</span>
        </div>
        <div class="demo-field">
            <span id="dp-inline-disabled">Disabled</span>
            <DatePicker :model-value="plus(1)" inline disabled aria-labelledby="dp-inline-disabled" />
        </div>
    </DemoSection>
    <DemoSection title="Sizes, variants and states">
        <DatePicker size="small" placeholder="Small" aria-label="Small" />
        <DatePicker placeholder="Normal" aria-label="Normal" />
        <DatePicker size="large" placeholder="Large" aria-label="Large" />
        <DatePicker variant="filled" placeholder="Filled" aria-label="Filled" />
        <DatePicker invalid placeholder="Invalid" aria-label="Invalid" />
        <DatePicker :model-value="start" disabled aria-label="Disabled" />
        <DatePicker :model-value="start" readonly aria-label="Read only" />
    </DemoSection>
    <DemoSection title="Fluid" class="stack">
        <DatePicker fluid placeholder="Fills its container" aria-label="Fluid" />
    </DemoSection>
</template>

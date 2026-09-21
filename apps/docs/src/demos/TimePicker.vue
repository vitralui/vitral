<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'TimePicker',
    category: 'Form',
    description:
        'A time of day: a text box that takes what is typed and a list of times under it. The value is minutes past midnight, not a `Date` — a time has no day and no zone of its own, and binding it to a date would give it both. It is the WAI-ARIA combobox, not the date picker’s dialog: a time is one number from a list rather than a grid to be walked in two directions, so the arrows move through it, Enter takes one and Escape shuts it. Typing is forgiving, because a time box is a place people type: `9`, `930`, `9:30`, `9h30`, `21:30` and `9 pm` all land where they were meant to.'
};
</script>

<script setup lang="ts">
import { formatMinutes } from '@vitral/core';
import { TimePicker } from '@vitral/vue';
import { computed, ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const start = ref<number | null>(540);
const typed = ref<number | null>(null);
const office = ref<number | null>(null);
const twelve = ref<number | null>(1290);
const inline = ref<number | null>(600);

const show = (minutes: number | null) => (minutes === null ? 'nothing' : formatMinutes(minutes, { hour12: false }));
const nights = computed(() => (start.value === null ? '' : `${start.value} minutes past midnight`));
</script>

<template>
    <DemoSection title="Default" description="Half-hourly by default. The box shows the time the way the locale writes it; the value underneath is a number.">
        <div class="demo-stack">
            <TimePicker v-model="start" aria-label="Start time" />
            <span class="demo-hint">{{ nights }}</span>
        </div>
    </DemoSection>

    <DemoSection title="Typed, not chosen" description="A time box is a place people type. Try `9`, `930`, `9:30`, `9h30`, `21:30` or `9 pm` — then leave the box. Something that names no time empties it rather than guessing.">
        <div class="demo-stack">
            <TimePicker v-model="typed" placeholder="Type a time" aria-label="Any time" />
            <span class="demo-hint">Reads as {{ show(typed) }}</span>
        </div>
    </DemoSection>

    <DemoSection title="Bounded, and stepped" description="`min-time` and `max-time` decide what the list offers and clamp what is typed; `step` decides how close together the times are. Page Up and Page Down move the value itself by an hour.">
        <TimePicker v-model="office" :step="15" min-time="09:00" max-time="17:00" show-clear-button aria-label="Office hours" />
    </DemoSection>

    <DemoSection title="Twelve or twenty-four" description="`hour12` overrides what the locale would have written. The list and the box always agree, because both are built from the same number.">
        <div style="display: flex; gap: 1rem; flex-wrap: wrap">
            <TimePicker v-model="twelve" :hour12="true" aria-label="Twelve hour" />
            <TimePicker v-model="twelve" :hour12="false" aria-label="Twenty-four hour" />
        </div>
    </DemoSection>

    <DemoSection title="Inline" description="Without the text box or the popup.">
        <TimePicker v-model="inline" :step="60" inline aria-label="Pick an hour" />
    </DemoSection>
</template>

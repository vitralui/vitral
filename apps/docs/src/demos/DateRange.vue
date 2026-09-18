<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DateRange',
    category: 'Form',
    description:
        'Two dates and the days between them. Two months side by side by default, because a span that crosses a month boundary is the ordinary case and paging back and forth to pick it is not; `months="1"` shows the same range in one calendar. The first press opens the range and the second closes it, either way round — the ends sort themselves — and while one end is down the day under the pointer or the arrows is drawn as the other, so the span is visible before it is committed. It is the WAI-ARIA date picker dialog with one span instead of one day: one tabbable day across every month, focus kept in the dialog, Escape back to the button.'
};
</script>

<script setup lang="ts">
import { Button, DateRange, type DateRangeValue } from '@vitral/vue';
import { computed, ref } from 'vue';
import DemoSection from '../DemoSection.vue';
import CodeBlock from '../parts/CodeBlock.vue';

const at = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
};

const stay = ref<DateRangeValue>({ start: at(3), end: at(9) });
const single = ref<DateRangeValue>({ start: null, end: null });
const report = ref<DateRangeValue>({ start: at(-30), end: at(0) });
const inline = ref<DateRangeValue>({ start: at(1), end: at(5) });

const nights = computed(() => (stay.value.start && stay.value.end ? Math.round((stay.value.end.getTime() - stay.value.start.getTime()) / 86400000) : 0));

// A range picker is usually next to a few spans people ask for by name.
const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 }
];
const usePreset = (days: number) => (report.value = { start: at(-days + 1), end: at(0) });

const shape = `const stay = ref<DateRange>({ start: null, end: null });

<DateRange v-model="stay" :min-date="new Date()" show-clear-button />`;
</script>

<template>
    <DemoSection title="Two months" description="The default. Pick a start, then an end; the band between them follows the pointer before you commit.">
        <div class="demo-field" style="min-width: 0">
            <span id="dr-stay">Your stay</span>
            <DateRange v-model="stay" :min-date="at(0)" show-clear-button aria-labelledby="dr-stay" />
            <span class="demo-hint">{{ nights ? `${nights} night${nights === 1 ? '' : 's'}` : 'No dates yet' }}</span>
        </div>
    </DemoSection>

    <DemoSection title="One month" description="The same range in a single calendar, for a form with no room for two.">
        <div class="demo-field" style="min-width: 0">
            <span id="dr-one">Dates</span>
            <DateRange v-model="single" :months="1" placeholder="Pick two dates" aria-labelledby="dr-one" />
            <span class="demo-hint">{{ single.start ? `${single.start.toLocaleDateString()} → ${single.end?.toLocaleDateString() ?? '…'}` : 'Empty' }}</span>
        </div>
    </DemoSection>

    <DemoSection title="With the spans people ask for by name" description="The footer is a slot: presets, a count of nights, whatever the form needs.">
        <DateRange v-model="report" :max-date="at(0)" aria-label="Reporting period">
            <template #footer="{ nights: n, clear }">
                <span class="demo-row" style="gap: 0.375rem">
                    <Button v-for="p in presets" :key="p.days" :label="p.label" severity="secondary" variant="text" size="small" @click="usePreset(p.days)" />
                </span>
                <span class="demo-hint">{{ n + 1 }} days · <a href="#" @click.prevent="clear">clear</a></span>
            </template>
        </DateRange>
    </DemoSection>

    <DemoSection title="Inline" description="Without the text box or the popup.">
        <DateRange v-model="inline" inline aria-label="Dates" />
    </DemoSection>

    <DemoSection title="The shape of it">
        <CodeBlock :code="shape" label="ts" lang="ts" />
    </DemoSection>
</template>

<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'UniformGrid',
    category: 'Layout',
    description:
        'A grid of equal cells. Give it rows or columns and it works out the other from the number of children; give it neither and it makes the smallest square that fits. FirstColumn leaves cells empty before the first child.'
};
</script>

<script setup lang="ts">
import { Button, UniformGrid, useLocale } from '@vitral/vue';
import { computed, ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const count = ref(7);

const { locale } = useLocale();
const today = new Date();
const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
const title = computed(() => `${locale.value.monthNames[today.getMonth()]} ${today.getFullYear()}`);
const firstDay = computed(() => locale.value.firstDayOfWeek);
const weekdays = computed(() => Array.from({ length: 7 }, (_, i) => locale.value.dayNamesMin[(i + firstDay.value) % 7]));
const offset = computed(() => (monthStart.getDay() - firstDay.value + 7) % 7);
</script>

<template>
    <DemoSection title="Square, from the children" description="Neither rows nor columns: the grid is the smallest square that holds every child. Add some and watch it grow.">
        <div class="controls">
            <Button icon="minus" severity="secondary" aria-label="Remove a cell" :disabled="count <= 1" @click="count--" />
            <Button icon="plus" severity="secondary" aria-label="Add a cell" @click="count++" />
            <span class="demo-hint">{{ count }} children</span>
        </div>
        <UniformGrid class="frame square">
            <div v-for="n in count" :key="n" class="box" :class="`c${((n - 1) % 5) + 1}`">{{ n }}</div>
        </UniformGrid>
    </DemoSection>

    <DemoSection title="Columns given, rows worked out" description="columns=&quot;4&quot; with ten children makes three rows, each as tall as the tallest cell.">
        <UniformGrid class="frame" :columns="4">
            <div v-for="n in 10" :key="n" class="box" :class="[`c${((n - 1) % 5) + 1}`, { tall: n === 6 }]">{{ n === 6 ? 'A taller cell sets every row' : n }}</div>
        </UniformGrid>
    </DemoSection>

    <DemoSection title="FirstColumn" description="A month: seven columns, and first-column set to the weekday the month starts on.">
        <div class="calendar">
            <strong>{{ title }}</strong>
            <UniformGrid :columns="7" :spacing="2" aria-hidden="true">
                <span v-for="day in weekdays" :key="day" class="weekday">{{ day }}</span>
            </UniformGrid>
            <UniformGrid :columns="7" :first-column="offset" :spacing="2">
                <span v-for="day in daysInMonth" :key="day" class="day" :class="{ today: day === today.getDate() }">{{ day }}</span>
            </UniformGrid>
        </div>
    </DemoSection>
</template>

<style scoped>
.controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
}

.frame {
    width: 100%;
    padding: 0.5rem;
    border: 1px dashed color-mix(in srgb, var(--vt-text-color) 30%, transparent);
    border-radius: var(--vt-border-radius-md);
}

.square {
    max-width: 22rem;
}

.box {
    --c: var(--vt-chart-1);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 2.5rem;
    padding: 0.375rem;
    font-size: 0.8125rem;
    text-align: center;
    color: var(--vt-text-color);
    background: color-mix(in srgb, var(--c) 18%, transparent);
    border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
    border-radius: var(--vt-border-radius-sm);
}

.tall {
    min-height: 4.5rem;
}

.c1 {
    --c: var(--vt-chart-1);
}
.c2 {
    --c: var(--vt-chart-2);
}
.c3 {
    --c: var(--vt-chart-3);
}
.c4 {
    --c: var(--vt-chart-4);
}
.c5 {
    --c: var(--vt-chart-5);
}

.calendar {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 17rem;
    padding: 0.75rem;
    background: var(--vt-overlay-popover-background);
    border: 1px solid var(--vt-overlay-popover-border-color);
    border-radius: var(--vt-border-radius-lg);
}

.weekday {
    font-size: 0.75rem;
    text-align: center;
    color: var(--vt-text-muted-color);
}

.day {
    padding: 0.375rem 0;
    text-align: center;
    border-radius: var(--vt-border-radius-pill);
}

.day:hover {
    background: var(--vt-content-hover-background);
}

.today {
    color: var(--vt-primary-contrast-color);
    background: var(--vt-primary-color);
}

.today:hover {
    background: var(--vt-primary-hover-color);
}
</style>

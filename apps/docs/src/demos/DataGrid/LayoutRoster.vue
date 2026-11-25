<script setup lang="ts">
import { Column, DataGrid } from '@vitral/vue';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
type Day = (typeof DAYS)[number];
type Person = { id: number; name: string; team: string } & Record<Day, number>;

// A small deterministic generator, so the roster is the same every time.
let seed = 11;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const people: Person[] = [
    ['Ana Souza', 'Kitchen'],
    ['Bruno Lima', 'Kitchen'],
    ['Carla Mendes', 'Kitchen'],
    ['Diego Ferreira', 'Floor'],
    ['Élise Martin', 'Floor'],
    ['Fatou Diallo', 'Floor'],
    ['Kenji Sato', 'Bar'],
    ['Lucía Gómez', 'Bar']
].map(([name, team], i) => ({
    id: i + 1,
    name: name!,
    team: team!,
    ...(Object.fromEntries(DAYS.map((day) => [day, random() < 0.25 ? 0 : 4 + Math.round(random() * 7)])) as Record<Day, number>)
}));

const DAY_LIMIT = 9;
const WEEK_LIMIT = 44;
const week = (row: Person) => DAYS.reduce((sum, day) => sum + row[day], 0);
// The more hours, the deeper the colour; a day past the limit in the warning colour.
const heat = ({ value }: { value: unknown }) => {
    const hours = value as number;
    if (!hours) return { color: 'var(--vt-text-muted-color)' };
    const tone = hours > DAY_LIMIT ? 'var(--vt-warn-color)' : 'var(--vt-info-color)';
    return { background: `color-mix(in srgb, ${tone} ${Math.round((hours / 12) * 45)}%, transparent)` };
};
const said = (day: Day) => ({ row, value }: { row: Person; value: unknown }) =>
    !value ? `${row.name}, ${day}: off` : `${row.name}, ${day}: ${value} h${(value as number) > DAY_LIMIT ? `, ${(value as number) - DAY_LIMIT} over the day's ${DAY_LIMIT}` : ''}`;
const hours = (value: unknown) => (value ? `${value}` : '–');
const over = ({ value }: { value: unknown }) => ((value as number) > WEEK_LIMIT ? { color: 'var(--vt-danger-color)', fontWeight: '600' } : {});
</script>

<template>
    <DataGrid :value="people" data-key="id" aria-label="Hours this week" total-row size="small" show-gridlines class="demo-table">
        <Column field="team" header="Team" span-rows :width="100" />
        <Column field="name" header="Name" :width="150" />
        <Column v-for="day in DAYS" :key="day" :field="day" :header="day" align="center" :width="64" aggregate="sum" :body-style="heat" :tooltip="said(day)" :value-formatter="hours" />
        <Column column-key="week" header="Week" align="right" :width="80" aggregate="sum" :value-getter="week" :body-style="over" />
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>

<script setup lang="ts">
import { DateRange, type DateRangeValue, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const year = new Date().getFullYear();

const term = ref<DateRangeValue>({ start: null, end: null });
const years = ref<DateRangeValue>({ start: null, end: null });
const paged = ref<DateRangeValue>({ start: null, end: null });
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <span id="dr-term">Months only, within this school year</span>
            <DateRange v-model="term" :year-picker="false" :min-date="new Date(year, 1, 1)" :max-date="new Date(year, 11, 15)" placeholder="Pick a range" aria-labelledby="dr-term" />
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <span id="dr-years">Years only</span>
            <DateRange v-model="years" :month-picker="false" placeholder="Pick a range" aria-labelledby="dr-years" />
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <span id="dr-paged">Neither: the titles are only text</span>
            <DateRange v-model="paged" :month-picker="false" :year-picker="false" placeholder="Pick a range" aria-labelledby="dr-paged" />
        </StackPanel>
    </StackPanel>
</template>

<script setup lang="ts">
import { DatePicker, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const year = new Date().getFullYear();

const term = ref<Date | null>(null);
const founded = ref<Date | null>(null);
const paged = ref<Date | null>(null);
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="dp-term">Months only, within this school year</Label>
            <DatePicker id="dp-term" v-model="term" :year-picker="false" :min-date="new Date(year, 1, 1)" :max-date="new Date(year, 11, 15)" placeholder="Pick a date" />
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="dp-founded">Years only</Label>
            <DatePicker id="dp-founded" v-model="founded" :month-picker="false" placeholder="Pick a date" />
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="dp-paged">Neither: the title is only text</Label>
            <DatePicker id="dp-paged" v-model="paged" :month-picker="false" :year-picker="false" placeholder="Pick a date" />
        </StackPanel>
    </StackPanel>
</template>

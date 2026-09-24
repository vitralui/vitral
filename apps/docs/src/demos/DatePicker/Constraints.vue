<script setup lang="ts">
import { DatePicker, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const today = new Date();
const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
const plus = (days: number) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + days);

const booking = ref<Date | null>(null);
const holidays = [plus(4), plus(5)];
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="dp-booking">Delivery</Label>
        <DatePicker id="dp-booking" v-model="booking" :min-date="start" :max-date="plus(30)" :disabled-days="[0, 6]" :disabled-dates="holidays" placeholder="Choose a weekday" />
    </StackPanel>
</template>

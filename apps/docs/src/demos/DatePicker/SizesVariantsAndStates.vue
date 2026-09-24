<script setup lang="ts">
import { DatePicker } from '@vitral/vue';

const today = new Date();
const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
</script>

<template>
    <DatePicker size="small" placeholder="Small" aria-label="Small" />
    <DatePicker placeholder="Normal" aria-label="Normal" />
    <DatePicker size="large" placeholder="Large" aria-label="Large" />
    <DatePicker variant="filled" placeholder="Filled" aria-label="Filled" />
    <DatePicker invalid placeholder="Invalid" aria-label="Invalid" />
    <DatePicker :model-value="start" disabled aria-label="Disabled" />
    <DatePicker :model-value="start" readonly aria-label="Read only" />
</template>

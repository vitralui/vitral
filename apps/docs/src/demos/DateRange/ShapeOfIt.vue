<script setup lang="ts">
import { DateRange, type DateRangeValue } from '@vitral/vue';
import { ref } from 'vue';

const stay = ref<DateRangeValue>({ start: null, end: null });
</script>

<template>
    <DateRange v-model="stay" :min-date="new Date()" show-clear-button aria-label="Stay" />
</template>

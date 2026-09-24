<script setup lang="ts">
import { TimePicker } from '@vitral/vue';
import { ref } from 'vue';

const office = ref<number | null>(null);
</script>

<template>
    <TimePicker v-model="office" :step="15" min-time="09:00" max-time="17:00" show-clear-button aria-label="Office hours" />
</template>

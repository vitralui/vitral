<script setup lang="ts">
import { TimePicker } from '@vitral/vue';
import { ref } from 'vue';

const inline = ref<number | null>(600);
</script>

<template>
    <TimePicker v-model="inline" :step="60" inline aria-label="Pick an hour" />
</template>

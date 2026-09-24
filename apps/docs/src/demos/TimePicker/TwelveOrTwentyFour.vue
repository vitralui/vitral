<script setup lang="ts">
import { TimePicker } from '@vitral/vue';
import { ref } from 'vue';

const twelve = ref<number | null>(1290);
</script>

<template>
    <div style="display: flex; gap: 1rem; flex-wrap: wrap">
        <TimePicker v-model="twelve" :hour12="true" aria-label="Twelve hour" />
        <TimePicker v-model="twelve" :hour12="false" aria-label="Twenty-four hour" />
    </div>
</template>

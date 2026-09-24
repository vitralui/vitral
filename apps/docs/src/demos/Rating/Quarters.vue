<script setup lang="ts">
import { Rating, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const quarter = ref<number | null>(4.25);
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <span id="rating-quarter">Precision</span>
        <Rating v-model="quarter" :step="0.25" aria-labelledby="rating-quarter" />
        <small style="color: var(--vt-text-muted-color)">Value: {{ quarter ?? 'none' }}</small>
    </StackPanel>
</template>

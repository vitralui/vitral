<script setup lang="ts">
import { Rating, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const half = ref<number | null>(3.5);
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <span id="rating-half">How was it?</span>
        <Rating v-model="half" :step="0.5" aria-labelledby="rating-half" />
        <small style="color: var(--vt-text-muted-color)">Value: {{ half ?? 'none' }}</small>
    </StackPanel>
</template>

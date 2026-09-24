<script setup lang="ts">
import { Rating, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const score = ref<number | null>(3);
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <span id="rating-label">Your rating</span>
        <Rating v-model="score" aria-labelledby="rating-label" />
        <small style="color: var(--vt-text-muted-color)">Value: {{ score ?? 'none' }}</small>
    </StackPanel>
</template>

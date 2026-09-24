<script setup lang="ts">
import { Rating, StackPanel } from '@vitral/vue';

const average = 4.3;
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.625rem" align="center" wrap>
        <Rating :model-value="average" :step="0.1" readonly aria-label="Average rating" />
        <small style="color: var(--vt-text-muted-color)">{{ average }} out of 5, from 1,284 reviews</small>
    </StackPanel>
</template>

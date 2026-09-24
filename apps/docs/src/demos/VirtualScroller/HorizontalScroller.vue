<script setup lang="ts">
import { VirtualScroller } from '@vitral/vue';

const columns = Array.from({ length: 1000 }, (_, i) => i);
</script>

<template>
    <VirtualScroller :items="columns" :item-size="72" orientation="horizontal" scroll-width="100%" style="height: 5rem; border: 1px solid var(--vt-content-border-color)" aria-label="Columns">
        <template #item="{ item }">
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; border-inline-end: 1px solid var(--vt-content-border-color)">{{ item }}</div>
        </template>
    </VirtualScroller>
</template>

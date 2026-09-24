<script setup lang="ts">
import { VirtualScroller } from '@vitral/vue';
import { ref } from 'vue';

const lazyItems = ref<(string | null)[]>(Array.from({ length: 5000 }, () => null));
const loading = ref(false);
function load({ first, last }: { first: number; last: number }) {
    loading.value = true;
    setTimeout(() => {
        const next = [...lazyItems.value];
        for (let i = first; i < last; i++) next[i] = `Loaded row ${i}`;
        lazyItems.value = next;
        loading.value = false;
    }, 400);
}
</script>

<template>
    <VirtualScroller :items="lazyItems" :item-size="36" scroll-height="14rem" lazy :loading="loading" :delay="150" aria-label="Lazy rows" style="width: 100%; border: 1px solid var(--vt-content-border-color)" @lazy-load="load">
        <template #item="{ item, options }">
            <div style="height: 36px; display: flex; align-items: center; padding: 0 1rem">{{ item ?? `Row ${options.index}…` }}</div>
        </template>
    </VirtualScroller>
</template>

<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'VirtualScroller',
    category: 'Data',
    description:
        'Renders only the items near the viewport, so a list of a hundred thousand rows costs what a screenful does. It is a keyboard-scrollable region; in lazy mode it asks for ranges as they come into view.'
};
</script>

<script setup lang="ts">
import { Button, VirtualScroller } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const items = Array.from({ length: 100000 }, (_, i) => ({ id: i, name: `Item #${i}` }));
const columns = Array.from({ length: 1000 }, (_, i) => i);

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

const scroller = ref<InstanceType<typeof VirtualScroller> | null>(null);
</script>

<template>
    <DemoSection title="A hundred thousand rows" class="stack">
        <Button label="Jump to #50,000" severity="secondary" style="align-self: flex-start" @click="scroller?.scrollToIndex(50000)" />
        <VirtualScroller ref="scroller" :items="items" :item-size="40" scroll-height="16rem" data-key="id" aria-label="Items" style="border: 1px solid var(--vt-content-border-color)">
            <template #item="{ item, options }">
                <div :style="{ height: '40px', display: 'flex', alignItems: 'center', padding: '0 1rem', background: options.odd ? 'var(--vt-content-hover-background)' : undefined }">
                    {{ (item as { name: string }).name }}
                </div>
            </template>
        </VirtualScroller>
    </DemoSection>
    <DemoSection title="Horizontal">
        <VirtualScroller :items="columns" :item-size="72" orientation="horizontal" scroll-width="100%" style="height: 5rem; border: 1px solid var(--vt-content-border-color)" aria-label="Columns">
            <template #item="{ item }">
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; border-inline-end: 1px solid var(--vt-content-border-color)">{{ item }}</div>
            </template>
        </VirtualScroller>
    </DemoSection>
    <DemoSection title="Lazy">
        <VirtualScroller :items="lazyItems" :item-size="36" scroll-height="14rem" lazy :loading="loading" :delay="150" aria-label="Lazy rows" style="width: 100%; border: 1px solid var(--vt-content-border-color)" @lazy-load="load">
            <template #item="{ item, options }">
                <div style="height: 36px; display: flex; align-items: center; padding: 0 1rem">{{ item ?? `Row ${options.index}…` }}</div>
            </template>
        </VirtualScroller>
    </DemoSection>
</template>

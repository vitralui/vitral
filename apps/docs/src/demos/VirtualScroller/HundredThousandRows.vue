<script setup lang="ts">
import { Button, VirtualScroller } from '@vitral/vue';
import { ref } from 'vue';

const items = Array.from({ length: 100000 }, (_, i) => ({ id: i, name: `Item #${i}` }));

const scroller = ref<InstanceType<typeof VirtualScroller> | null>(null);
</script>

<template>
    <Button label="Jump to #50,000" severity="secondary" style="align-self: flex-start" @click="scroller?.scrollToIndex(50000)" />
    <VirtualScroller ref="scroller" :items="items" :item-size="40" scroll-height="16rem" data-key="id" aria-label="Items" style="border: 1px solid var(--vt-content-border-color)">
        <template #item="{ item, options }">
            <div :style="{ height: '40px', display: 'flex', alignItems: 'center', padding: '0 1rem', background: options.odd ? 'var(--vt-content-hover-background)' : undefined }">
                {{ (item as { name: string }).name }}
            </div>
        </template>
    </VirtualScroller>
</template>

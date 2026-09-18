<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DataView',
    category: 'Data',
    description:
        'The data layer with your own template per item, in a list or a grid: DataView sorts and pages, and the `list` and `grid` slots decide the markup — and so the semantics — of what they show.'
};
</script>

<script setup lang="ts">
import { Button, DataView, SelectButton, Tag } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    stock: 'In stock' | 'Low' | 'Out';
    image: number;
}

const categories = ['Accessories', 'Clothing', 'Fitness', 'Electronics'];
const products: Product[] = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    name: ['Bamboo Watch', 'Black Jacket', 'Blue Band', 'Game Controller', 'Gaming Set', 'Gold Necklace'][i % 6]! + ` ${i + 1}`,
    category: categories[i % 4]!,
    price: 20 + ((i * 37) % 180),
    stock: (['In stock', 'Low', 'Out'] as const)[i % 3]!,
    image: 20 + i
}));

const layout = ref<'list' | 'grid'>('grid');
const sortOrder = ref<1 | -1>(1);
const severity = (stock: Product['stock']) => (stock === 'In stock' ? 'success' : stock === 'Low' ? 'warn' : 'danger');
</script>

<template>
    <DemoSection title="List and grid" class="stack">
        <DataView :value="products" :layout="layout" paginator :rows="6" sort-field="price" :sort-order="sortOrder" data-key="id">
            <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem">
                    <Button :label="sortOrder === 1 ? 'Price: low to high' : 'Price: high to low'" icon="sort" severity="secondary" variant="text" @click="sortOrder = sortOrder === 1 ? -1 : 1" />
                    <SelectButton v-model="layout" :options="['list', 'grid']" :allow-empty="false" aria-label="Layout" />
                </div>
            </template>
            <template #list="{ items }">
                <ul style="margin: 0; padding: 0; list-style: none">
                    <li v-for="p in items as Product[]" :key="p.id" style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--vt-content-border-color)">
                        <img :src="`https://picsum.photos/id/${p.image}/96/96`" alt="" width="48" height="48" style="border-radius: 6px" />
                        <div style="flex: 1">
                            <strong>{{ p.name }}</strong>
                            <div class="demo-hint">{{ p.category }}</div>
                        </div>
                        <Tag :value="p.stock" :severity="severity(p.stock)" />
                        <span style="width: 4rem; text-align: end">${{ p.price }}</span>
                    </li>
                </ul>
            </template>
            <template #grid="{ items }">
                <article v-for="p in items as Product[]" :key="p.id" style="border: 1px solid var(--vt-content-border-color); border-radius: 8px; overflow: hidden">
                    <img :src="`https://picsum.photos/id/${p.image}/320/200`" :alt="p.name" style="display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover" />
                    <div style="padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem">
                        <strong>{{ p.name }}</strong>
                        <span class="demo-hint">{{ p.category }}</span>
                        <div style="display: flex; justify-content: space-between; align-items: center">
                            <span>${{ p.price }}</span>
                            <Tag :value="p.stock" :severity="severity(p.stock)" />
                        </div>
                    </div>
                </article>
            </template>
        </DataView>
    </DemoSection>
</template>

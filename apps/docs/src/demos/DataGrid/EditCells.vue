<script setup lang="ts">
import { Button, Column, DataGrid, Select, StackPanel, useVitral, type DataGridCellEditEvent } from '@vitral/vue';
import { computed, ref } from 'vue';

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    stock: number;
    launch: Date;
    active: boolean;
}

const categories = ['Furniture', 'Lighting', 'Textiles', 'Kitchen'];

const products = ref<Product[]>([
    { id: 1, name: 'Oak desk', category: 'Furniture', price: 420, stock: 12, launch: new Date(2026, 1, 3), active: true },
    { id: 2, name: 'Brass lamp', category: 'Lighting', price: 89.9, stock: 40, launch: new Date(2026, 3, 18), active: true },
    { id: 3, name: 'Wool rug', category: 'Textiles', price: 249, stock: 0, launch: new Date(2025, 10, 2), active: false },
    { id: 4, name: 'Clay pot', category: 'Kitchen', price: 24.5, stock: 130, launch: new Date(2026, 5, 9), active: true },
    { id: 5, name: 'Linen chair', category: 'Furniture', price: 189, stock: 7, launch: new Date(2026, 7, 21), active: true }
]);

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR' }));
const day = computed(() => new Intl.DateTimeFormat(config.locale.code, { dateStyle: 'medium' }));
const value = computed(() => products.value.reduce((sum, product) => sum + product.price * product.stock, 0));

const required = (text: unknown) => (String(text ?? '').trim() ? true : 'A name is needed');
const notNegative = (number: unknown) => (typeof number === 'number' && number < 0 ? 'Cannot be below zero' : true);

const grid = ref<InstanceType<typeof DataGrid> | null>(null);
const last = ref('Double-click a cell, or move to it and type.');
const said = (event: DataGridCellEditEvent) => (last.value = `${event.key}: ${String(event.value)} → ${String(event.newValue)}`);
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <DataGrid ref="grid" :value="products" data-key="id" aria-label="Products" show-gridlines class="demo-table" @cell-edit-complete="said" @cell-edit-undo="said">
            <template #header>
                <div class="demo-table-bar">
                    <strong>Catalogue</strong>
                    <span class="demo-muted">Stock worth {{ money.format(value) }}</span>
                    <Button size="small" severity="secondary" variant="outlined" icon="undo" label="Undo" class="demo-end" @click="grid?.undo()" />
                    <Button size="small" severity="secondary" variant="outlined" label="Redo" @click="grid?.redo()" />
                </div>
            </template>
            <Column field="name" header="Name" editable :validate="required" />
            <Column field="category" header="Category" editable>
                <template #editor="{ value, setValue, commit }">
                    <Select
                        :model-value="value"
                        :options="categories"
                        size="small"
                        aria-label="Category"
                        fluid
                        @update:model-value="
                            (next: unknown) => {
                                setValue(next);
                                commit();
                            }
                        "
                    />
                </template>
            </Column>
            <Column field="price" header="Price" editable align="right" :validate="notNegative">
                <template #body="{ data }">{{ money.format(data.price) }}</template>
            </Column>
            <Column field="stock" header="Stock" editable align="right" :validate="notNegative" />
            <Column field="launch" header="Launch" editable>
                <template #body="{ data }">{{ day.format(data.launch) }}</template>
            </Column>
            <Column field="active" header="On sale" editable align="center">
                <template #body="{ data }">{{ data.active ? 'Yes' : 'No' }}</template>
            </Column>
        </DataGrid>
        <small class="demo-muted" aria-live="polite">{{ last }}</small>
    </StackPanel>
</template>

<style scoped>
.demo-table {
    width: 100%;
}

.demo-table-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.demo-end {
    margin-inline-start: auto;
}

.demo-muted {
    color: var(--vt-text-muted-color);
}
</style>

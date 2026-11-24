<script setup lang="ts">
import { Column, DataGrid, Icon, InputText, ProgressBar, useVitral } from '@vitral/vue';
import { computed, ref } from 'vue';

interface Product {
    id: number;
    sku: string;
    name: string;
    category: string;
    stock: number;
    capacity: number;
    price: number;
    /** What the stock on hand is worth. */
    value: number;
}

const catalogue: [string, string[]][] = [
    ['Furniture', ['Oak desk', 'Walnut shelf', 'Linen chair', 'Cedar bench', 'Steel stool']],
    ['Lighting', ['Brass lamp', 'Paper pendant', 'Wall sconce', 'Desk light']],
    ['Textiles', ['Wool rug', 'Cotton throw', 'Linen curtain', 'Velvet cushion']],
    ['Kitchen', ['Clay pot', 'Glass vase', 'Stoneware bowl', 'Copper kettle', 'Olive board']]
];

let seed = 31;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

let next = 0;
const products: Product[] = catalogue.flatMap(([category, names]) =>
    names.map((name) => {
        const capacity = 50 + Math.floor(random() * 10) * 25;
        next++;
        const stock = Math.floor(random() * capacity);
        const price = Math.round(10 + random() * 490);
        return { id: next, sku: `${category.slice(0, 3).toUpperCase()}-${String(next).padStart(3, '0')}`, name, category, stock, capacity, price, value: stock * price };
    })
);

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }));
const number = computed(() => new Intl.NumberFormat(config.locale.code));

const filters = ref({ global: { value: null as string | null, matchMode: 'contains' } });
const collapsed = ref<string[]>([]);

// The totals of what the search lets through, held under the rows.
const totals = ({ rows }: { rows: Product[] }) => [
    {
        id: 'total',
        sku: '',
        name: `${rows.length} products`,
        category: '',
        stock: rows.reduce((sum, row) => sum + row.stock, 0),
        capacity: rows.reduce((sum, row) => sum + row.capacity, 0),
        price: 0,
        value: rows.reduce((sum, row) => sum + row.value, 0)
    }
];
const level = (row: Product) => Math.round((row.stock / row.capacity) * 100);
</script>

<template>
    <DataGrid
        v-model:filters="filters"
        v-model:collapsed-groups="collapsed"
        :value="products"
        data-key="id"
        aria-label="Stock"
        group-by="category"
        sort-mode="multiple"
        :global-filter-fields="['sku', 'name', 'category']"
        :pinned-bottom-rows="totals"
        scrollable
        scroll-height="420px"
        size="small"
        class="demo-table"
    >
        <template #header>
            <div class="demo-table-bar">
                <strong>Stock</strong>
                <InputText v-model="filters.global.value" placeholder="Search stock" aria-label="Search stock" size="small" clearable class="demo-table-search">
                    <template #prefix><Icon icon="search" /></template>
                </InputText>
            </div>
        </template>
        <Column field="sku" header="SKU" sortable>
            <template #body="{ data }"><code>{{ data.sku }}</code></template>
        </Column>
        <Column field="name" header="Product" sortable />
        <Column field="stock" header="On hand" sortable align="right" :width="280">
            <template #body="{ data, pinned }">
                <span class="demo-level">
                    <ProgressBar :value="level(data)" :show-value="false" :aria-label="`${data.name}: ${level(data)}% of capacity`" class="demo-bar" />
                    <span class="demo-nowrap">{{ number.format(data.stock) }}<span v-if="pinned" class="demo-muted"> / {{ number.format(data.capacity) }}</span></span>
                </span>
            </template>
        </Column>
        <Column field="price" header="Unit price" sortable align="right">
            <template #body="{ data, pinned }">{{ pinned ? '' : money.format(data.price) }}</template>
        </Column>
        <Column field="value" header="Value" sortable align="right">
            <template #body="{ data }">{{ money.format(data.value) }}</template>
        </Column>
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}

.demo-table-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.demo-table-search {
    margin-inline-start: auto;
    width: 16rem;
}

.demo-level {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
}

.demo-bar {
    flex: 1 1 auto;
    max-width: 8rem;
    height: 0.375rem;
}

.demo-nowrap {
    white-space: nowrap;
}

.demo-muted {
    color: var(--vt-text-muted-color);
}
</style>

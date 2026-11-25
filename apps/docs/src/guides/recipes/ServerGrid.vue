<script setup lang="ts">
import { queryData } from '@vitral/core';
import { Button, Column, createDataSource, DataGrid, Icon, InputText, type LoadOptions } from '@vitral/vue';
import { ref } from 'vue';

interface Order {
    id: number;
    customer: string;
    city: string;
    total: number;
    status: 'Open' | 'Packed' | 'Shipped';
}

// Two hundred orders the "server" holds, the same every time.
const customers = ['Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Ramos', 'Elisa Prado', 'Fatou Diallo', 'Kenji Sato', 'Lucía Gómez', 'Noémie Dubois', 'Søren Jónsson'];
const cities = ['São Paulo', 'Recife', 'Lisboa', 'Montréal', 'Köln', 'Bogotá', 'Kraków', 'Tōkyō'];
const statuses = ['Open', 'Packed', 'Shipped'] as const;
const orders: Order[] = Array.from({ length: 200 }, (_, i) => ({
    id: 1001 + i,
    customer: customers[(i * 7) % customers.length]!,
    city: cities[(i * 3) % cities.length]!,
    total: Math.round(((i * 7919) % 250_000) + 990) / 100,
    status: statuses[(i * 5) % 3]!
}));

// What the server was asked last, shown under the grid.
const asked = ref('');

// A stand-in for `fetch`: what the request would carry, then the page, 400 ms later.
const source = createDataSource<Order>({
    load: async (options: LoadOptions) => {
        asked.value = toQuery(options).toString();
        await new Promise((resolve) => setTimeout(resolve, 400));
        return queryData(orders, options);
    }
});

function toQuery(options: LoadOptions): URLSearchParams {
    const query = new URLSearchParams({ offset: String(options.first ?? 0), limit: String(options.rows ?? 20) });
    for (const { field, order } of options.sort ?? []) query.append('sort', `${order === -1 ? '-' : ''}${field}`);
    const search = options.globalFilter?.value;
    if (search) query.set('q', String(search));
    return query;
}

const filters = ref({ global: { value: null as string | null, matchMode: 'contains' } });
const grid = ref<InstanceType<typeof DataGrid> | null>(null);
</script>

<template>
    <DataGrid
        ref="grid"
        v-model:filters="filters"
        :data-source="source"
        :global-filter-fields="['customer', 'city']"
        :filter-delay="300"
        loading-mode="skeleton"
        paginator
        :rows="8"
        data-key="id"
        aria-label="Orders"
    >
        <template #header>
            <div class="recipe-bar">
                <InputText v-model="filters.global.value" placeholder="Customer or city" aria-label="Search the orders" size="small">
                    <template #prefix><Icon icon="search" /></template>
                </InputText>
                <Button label="Reload" icon="refresh" size="small" variant="outlined" severity="secondary" @click="grid?.reload()" />
            </div>
        </template>
        <Column field="id" header="Order" sortable :width="100" />
        <Column field="customer" header="Customer" sortable />
        <Column field="city" header="City" sortable />
        <Column field="status" header="Status" sortable :width="120" />
        <Column field="total" header="Total" sortable align="right" :width="120" />
    </DataGrid>
    <p class="recipe-note">
        GET /orders?<code>{{ asked }}</code>
    </p>
</template>

<style scoped>
.recipe-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: space-between;
}

.recipe-note {
    margin: 0.75rem 0 0;
    font-size: 0.8125rem;
    color: var(--vt-text-muted-color);
    overflow-wrap: anywhere;
}
</style>

<script setup lang="ts">
import { Button, Column, DataGrid, Icon, InputText, Tag, useVitral } from '@vitral/vue';
import { computed, ref } from 'vue';

type State = 'Paid' | 'Pending' | 'Refunded';

interface Order {
    id: number;
    number: string;
    customer: string;
    placed: Date;
    items: number;
    total: number;
    state: State;
}

let seed = 29;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)]!;
const customers = ['Northwind', 'Ferro & Filhos', 'Blue Harbor', 'Kestrel Labs', 'Atelier Lumen', 'Pampa Foods', 'Fjord Logistics', 'Orbital Print', 'Casa Verde', 'Maple & Co'];
const states: State[] = ['Paid', 'Paid', 'Paid', 'Pending', 'Refunded'];

const orders: Order[] = Array.from({ length: 5000 }, (_, i) => ({
    id: i + 1,
    number: `SO-${String(24000 + i)}`,
    customer: pick(customers),
    placed: new Date(2026, Math.floor(random() * 11), 1 + Math.floor(random() * 28)),
    items: 1 + Math.floor(random() * 12),
    total: Math.round(random() * 400_000) / 100,
    state: pick(states)
}));

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR' }));
const number = computed(() => new Intl.NumberFormat(config.locale.code));
const day = computed(() => new Intl.DateTimeFormat(config.locale.code, { dateStyle: 'medium' }));
const tone: Record<State, 'success' | 'warn' | 'secondary'> = { Paid: 'success', Pending: 'warn', Refunded: 'secondary' };

const filters = ref({ global: { value: null as string | null, matchMode: 'contains' } });
const selected = ref<Order[]>([]);
const shown = ref<Order[]>(orders);
const sum = computed(() => shown.value.reduce((total, order) => total + order.total, 0));
const grid = ref<InstanceType<typeof DataGrid> | null>(null);
</script>

<template>
    <!-- The grid fills the panel: its rows scroll between the toolbar and the status bar. -->
    <div class="demo-panel">
        <DataGrid
            ref="grid"
            v-model:filters="filters"
            v-model:selection="selected"
            :value="orders"
            data-key="id"
            aria-label="Orders"
            virtual-scroll
            scroll-height="flex"
            :global-filter-fields="['number', 'customer', 'state']"
            selection-mode="multiple"
            :row-height="40"
            class="demo-fill"
            @filter="shown = $event.filteredValue as Order[]"
        >
            <template #header>
                <div class="demo-table-bar">
                    <strong>Orders</strong>
                    <InputText v-model="filters.global.value" placeholder="Search orders" aria-label="Search orders" size="small" clearable class="demo-table-search">
                        <template #prefix><Icon icon="search" /></template>
                    </InputText>
                    <Button size="small" severity="secondary" variant="outlined" icon="download" label="Export" @click="grid?.exportCSV({ filename: 'orders.csv' })" />
                </div>
            </template>
            <Column selection-mode="multiple" />
            <Column field="number" header="Order" sortable />
            <Column field="customer" header="Customer" sortable />
            <Column field="placed" header="Placed" sortable>
                <template #body="{ data }">{{ day.format(data.placed) }}</template>
            </Column>
            <Column field="items" header="Items" sortable align="right" />
            <Column field="state" header="State" sortable>
                <template #body="{ data }"><Tag :value="data.state" :severity="tone[data.state as State]" /></template>
            </Column>
            <Column field="total" header="Total" sortable align="right">
                <template #body="{ data }">{{ money.format(data.total) }}</template>
            </Column>
            <template #footer>
                <div class="demo-status" role="status">
                    <span>{{ number.format(shown.length) }} of {{ number.format(orders.length) }} orders</span>
                    <span>{{ number.format(selected.length) }} selected</span>
                    <span class="demo-end">Sum <strong>{{ money.format(sum) }}</strong></span>
                </div>
            </template>
        </DataGrid>
    </div>
</template>

<style scoped>
.demo-panel {
    display: flex;
    width: 100%;
    height: 460px;
}

.demo-fill {
    flex: 1 1 auto;
    min-width: 0;
}

.demo-table-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.demo-table-search {
    margin-inline-start: auto;
    width: 14rem;
}

.demo-status {
    display: flex;
    gap: 1.25rem;
    font-size: 0.8125rem;
}

.demo-end {
    margin-inline-start: auto;
}
</style>

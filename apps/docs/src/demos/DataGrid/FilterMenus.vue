<script setup lang="ts">
import { Column, DataGrid, Tag, useVitral, type DataGridMenuItem } from '@vitral/vue';
import { computed, ref } from 'vue';

interface Order {
    id: number;
    customer: string;
    city: string;
    status: 'Placed' | 'Shipped' | 'Delivered' | 'Returned';
    total: number;
    placed: Date;
}

const customers = ['Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Ferreira', 'Elisa Rocha', 'Fábio Nunes', 'Gabriela Dias', 'Hugo Martins'];
const cities = ['Lisbon', 'Porto', 'São Paulo', 'Recife', 'Madrid', 'Berlin'];
const statuses: Order['status'][] = ['Placed', 'Shipped', 'Delivered', 'Returned'];

const orders = ref<Order[]>(
    Array.from({ length: 60 }, (_, i) => ({
        id: 1001 + i,
        customer: customers[(i * 5) % customers.length]!,
        city: cities[(i * 7) % cities.length]!,
        status: statuses[(i * 3) % 7 < 4 ? (i * 3) % 7 : i % 3]!,
        total: Math.round(((i * 37) % 480) + 20 + ((i * 13) % 100) / 100),
        placed: new Date(2026, i % 10, ((i * 11) % 27) + 1)
    }))
);

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR' }));
const day = computed(() => new Intl.DateTimeFormat(config.locale.code, { dateStyle: 'medium' }));
const severity = { Placed: 'info', Shipped: 'warn', Delivered: 'success', Returned: 'danger' } as const;

// The grid holds the rows as they are, so the change goes through the page's own list.
const ship = (id: number) => {
    const order = orders.value.find((entry) => entry.id === id);
    if (order) order.status = 'Shipped';
};

// The cell's menu keeps what the grid offers and adds a command of the page's own.
const cellMenu = ({ row, items }: { row: Order; items: DataGridMenuItem[] }): DataGridMenuItem[] => [
    { label: row.status === 'Placed' ? 'Mark as shipped' : 'Already shipped', icon: 'check', disabled: row.status !== 'Placed', onSelect: () => ship(row.id) },
    { separator: true },
    ...items
];
</script>

<template>
    <DataGrid :value="orders" data-key="id" aria-label="Customer orders" filter-display="menu" column-menu :context-menu="cellMenu" paginator :rows="8" class="demo-table">
        <Column field="id" header="Order" sortable :width="100" />
        <Column field="customer" header="Customer" sortable filter />
        <Column field="city" header="City" sortable filter="set" />
        <Column field="status" header="Status" filter="set">
            <template #body="{ data }"><Tag :value="data.status" :severity="severity[data.status as Order['status']]" /></template>
        </Column>
        <Column field="total" header="Total" sortable filter align="right">
            <template #body="{ data }">{{ money.format(data.total) }}</template>
        </Column>
        <Column field="placed" header="Placed" sortable filter>
            <template #body="{ data }">{{ day.format(data.placed) }}</template>
        </Column>
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>

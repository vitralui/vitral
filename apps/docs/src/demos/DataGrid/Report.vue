<script setup lang="ts">
import { Column, DataGrid, useVitral } from '@vitral/vue';
import { computed, ref } from 'vue';

interface Sale {
    id: number;
    date: Date;
    customer: string;
    product: string;
    seller: string;
    quantity: number;
    price: number;
    discount: number;
    freight: number;
}

const customers = ['Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Ferreira', 'Elisa Rocha', 'Fábio Nunes'];
const products = [
    ['Linen shirt', 89.9],
    ['Cotton tee', 39.9],
    ['Denim jacket', 249],
    ['Wool scarf', 59.5],
    ['Canvas tote', 45]
] as const;
const sellers = ['Gabriela', 'Hugo', 'Inês'];
// The same sales on every visit: a small hash of its own, rather than Math.random.
const pick = (n: number, count: number) => {
    let t = n + 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * count);
};
const sales = ref<Sale[]>(
    Array.from({ length: 180 }, (_, i) => {
        const [product, price] = products[pick(i + 300, products.length)]!;
        const quantity = pick(i + 900, 6) + 1;
        return {
            id: i + 1,
            date: new Date(2026, 9, 26 + pick(i, 29)),
            customer: customers[pick(i + 100, customers.length)]!,
            product,
            seller: sellers[pick(i + 200, sellers.length)]!,
            quantity,
            price,
            discount: pick(i + 400, 4) === 0 ? Math.round(quantity * price * 0.1 * 100) / 100 : 0,
            freight: pick(i + 500, 3) * 9.9
        };
    })
);

const gross = (sale: Sale) => sale.quantity * sale.price;
const net = (sale: Sale) => gross(sale) - sale.discount + sale.freight;

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR' }));
const day = computed(() => new Intl.DateTimeFormat(config.locale.code, { dateStyle: 'short' }));
const size = ref<'small' | 'large' | undefined>('small');
const panel = ref<'columns' | 'dictionary' | null>(null);
</script>

<template>
    <DataGrid
        v-model:size="size"
        v-model:side-bar-open="panel"
        :value="sales"
        data-key="id"
        aria-label="Sales report"
        :side-bar="['columns', 'dictionary']"
        toolbar
        show-gridlines
        resizable-columns
        reorderable-columns
        column-menu
        paginator
        :rows="25"
        :rows-per-page-options="[25, 50, 100]"
        paginator-template="RowsPerPageLabel RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink PageInput NextPageLink LastPageLink"
        scrollable
        scroll-height="26rem"
        class="demo-report"
    >
        <template #header>
            <strong>Sales report</strong>
        </template>
        <Column field="date" header="Order date" sortable description="The day the order was placed, not the day it was invoiced.">
            <template #body="{ data }">{{ day.format(data.date) }}</template>
        </Column>
        <Column field="customer" header="Customer" sortable description="Who bought, as on the order." />
        <Column field="product" header="Product" sortable description="What was sold, one line of the order." />
        <Column field="seller" header="Seller" sortable description="The person credited with the sale." />
        <Column field="quantity" header="Quantity" align="right" sortable description="Units on the line." />
        <Column field="price" header="Unit price" align="right" sortable description="The price of one unit when the order was placed.">
            <template #body="{ data }">{{ money.format(data.price) }}</template>
        </Column>
        <Column header="Gross sale" align="right" :export-value="gross" description="What the line is worth before discounts and freight." formula="quantity × unit price">
            <template #body="{ data }">{{ money.format(gross(data)) }}</template>
        </Column>
        <Column field="discount" header="Discount" align="right" sortable description="Taken off the line, by a coupon or by the seller.">
            <template #body="{ data }">{{ money.format(data.discount) }}</template>
        </Column>
        <Column field="freight" header="Freight" align="right" sortable hidden description="What the customer paid for delivery.">
            <template #body="{ data }">{{ money.format(data.freight) }}</template>
        </Column>
        <Column header="Net sale" align="right" :export-value="net" formula="gross sale − discount + freight">
            <template #description>What the line brings in. <em>Freight</em> is counted, since the customer pays it.</template>
            <template #body="{ data }">{{ money.format(net(data)) }}</template>
        </Column>
    </DataGrid>
</template>

<style scoped>
.demo-report {
    width: 100%;
}
</style>

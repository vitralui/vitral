<script setup lang="ts">
import { Column, DataGrid, useVitral } from '@vitral/vue';
import { computed } from 'vue';

interface Entry {
    id: number;
    month: string;
    day: number;
    description: string;
    amount: number;
    balance: number;
}

const moves: [string, number, string, number][] = [
    ['September', 1, 'Opening balance carried over', 12_400],
    ['September', 3, 'Invoice 1041, Ximena Diallo', 1_280.5],
    ['September', 5, 'Office rent', -2_300],
    ['September', 18, 'Invoice 1042, Noémie Nowak', 318],
    ['September', 30, 'Payroll', -6_150],
    ['October', 2, 'Invoice 1043, Bruno Lima', 94.9],
    ['October', 5, 'Office rent', -2_300],
    ['October', 14, 'Laptops, three', -4_470],
    ['October', 31, 'Payroll', -6_150],
    ['November', 4, 'Invoice 1044, Kenji Sato', 9_210],
    ['November', 5, 'Office rent', -2_300],
    ['November', 20, 'Invoice 1045, Lucía Gómez', 3_640]
];
let running = 0;
const entries: Entry[] = moves.map(([month, day, description, amount], i) => ({ id: i + 1, month, day, description, amount, balance: (running += amount) }));

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'USD' }));
const asMoney = (value: unknown) => (typeof value === 'number' ? money.value.format(value) : '');
// Money out in the danger colour, a balance below zero too.
const sign = ({ value }: { value: unknown }) => ((value as number) < 0 ? { color: 'var(--vt-danger-color)' } : {});
// The balance at the foot is the last one, not a sum of them.
const closing = ({ rows }: { rows: Entry[] }) => rows.at(-1)?.balance;
</script>

<template>
    <DataGrid :value="entries" data-key="id" aria-label="Ledger" row-numbers total-row size="small" scrollable scroll-height="360px" class="demo-table">
        <Column field="month" header="Month" span-rows :width="130" />
        <Column field="day" header="Day" align="right" :width="70" />
        <Column field="description" header="Description" :flex="1" />
        <Column field="amount" header="Amount" align="right" :width="140" :value-formatter="asMoney" :body-style="sign" aggregate="sum" />
        <Column field="balance" header="Balance" align="right" :width="150" :value-formatter="asMoney" :body-style="sign" :aggregate="closing" />
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>

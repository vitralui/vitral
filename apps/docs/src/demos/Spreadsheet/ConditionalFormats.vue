<script setup lang="ts">
import { Spreadsheet, type ConditionalRuleLike } from '@vitral/vue';
import { ref } from 'vue';

const sales = ref<Record<string, string | number | boolean | null>>({
    A1: 'Region',
    B1: 'Target',
    C1: 'Sold',
    D1: 'Reached',
    E1: 'Status',
    A2: 'North',
    B2: 120,
    C2: 146,
    A3: 'South',
    B3: 150,
    C3: 98,
    A4: 'East',
    B4: 90,
    C4: 91,
    A5: 'West',
    B5: 110,
    C5: 64,
    A6: 'Centre',
    B6: 80,
    C6: 122,
    D2: '=C2/B2',
    D3: '=C3/B3',
    D4: '=C4/B4',
    D5: '=C5/B5',
    D6: '=C6/B6',
    E2: '=IF(D2>=1,"on track","behind")',
    E3: '=IF(D3>=1,"on track","behind")',
    E4: '=IF(D4>=1,"on track","behind")',
    E5: '=IF(D5>=1,"on track","behind")',
    E6: '=IF(D6>=1,"on track","behind")'
});

const rules: ConditionalRuleLike[] = [
    { range: 'E2:E6', when: { op: '=', value: 'behind' }, style: { tone: 'danger' } },
    { range: 'E2:E6', when: { op: '=', value: 'on track' }, style: { tone: 'success' } },
    { type: 'dataBar', range: 'C2:C6' },
    { type: 'colorScale', range: 'D2:D6', colors: ['#fecaca', '#fef9c3', '#bbf7d0'] },
    { range: 'D2:D6', when: { op: '>=', value: 1.2 }, style: { bold: true } }
];
</script>

<template>
    <Spreadsheet
        v-model="sales"
        :rows="10"
        :columns="6"
        :formats="{ 'D2:D6': { kind: 'percent' } }"
        :conditional-formats="rules"
        aria-label="Sales by region"
        style="height: 16rem; width: 100%"
    />
</template>

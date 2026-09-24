<script setup lang="ts">
import { Spreadsheet } from '@vitral/vue';
import { ref } from 'vue';

const invoice = ref<Record<string, string | number | boolean | null>>({
    A1: 'Item',
    B1: 'Price',
    C1: 'Qty',
    D1: 'Total',
    A2: 'Standing desk',
    B2: 320,
    C2: 2,
    D2: '=B2*C2',
    A3: 'Office chair',
    B3: 95.5,
    C3: 4,
    D3: '=B3*C3',
    A4: 'Monitor arm',
    B4: 48,
    C4: 2,
    D4: '=B4*C4',
    A6: 'Subtotal',
    D6: '=SUM(D2:D4)',
    A7: 'VAT',
    B7: '20%',
    D7: '=D6*B7',
    A8: 'Due',
    D8: '=D6+D7'
});

const formats = {
    'B2:B4': { kind: 'currency', currency: 'GBP' } as const,
    'D2:D8': { kind: 'currency', currency: 'GBP' } as const,
    B7: { kind: 'percent' } as const
};
</script>

<template>
    <Spreadsheet v-model="invoice" :formats="formats" :rows="20" :columns="6" aria-label="Invoice" style="height: 22rem; width: 100%" />
</template>

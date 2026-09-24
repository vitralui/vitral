<script setup lang="ts">
import { Spreadsheet, StackPanel } from '@vitral/vue';
import { nextTick, onMounted, ref } from 'vue';

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

// `v-model` carries what was typed; what a cell reads as comes from the sheet
// the component exposes.
const sheet = ref<InstanceType<typeof Spreadsheet> | null>(null);
const due = ref('');
async function readDue() {
    await nextTick();
    due.value = sheet.value?.sheet()?.display({ row: 7, col: 3 }) ?? '';
}
onMounted(readDue);
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <Spreadsheet ref="sheet" v-model="invoice" :formats="formats" :rows="10" :columns="5" aria-label="Invoice" style="height: 16rem; width: 100%" @change="readDue" />
        <p>
            What is kept for <code>D8</code> is <code>{{ invoice.D8 }}</code
            >, and it reads <strong>{{ due }}</strong> — edit a price above and both follow.
        </p>
    </StackPanel>
</template>

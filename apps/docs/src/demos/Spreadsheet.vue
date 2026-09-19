<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Spreadsheet',
    category: 'Data',
    description:
        'A spreadsheet with its own formula engine and no dependency: A1 references, rectangles, sixty-three functions, a dependency graph so an edit works out only what followed from it, and errors that travel. v-model is what was typed, keyed by A1, so a formula survives a round trip. The grid is one tab stop with a caret inside it — the arrows move a cell, Ctrl and an arrow jump to the end of a run, Tab and Enter walk the selected block, and a character starts an edit.'
};
</script>

<script setup lang="ts">
import { Spreadsheet } from '@vitral/vue';
import { nextTick, onMounted, ref } from 'vue';
import DemoSection from '../DemoSection.vue';

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

const scores = ref<Record<string, string | number | boolean | null>>({
    A1: 'Name',
    B1: 'Score',
    C1: 'Grade',
    A2: 'Ada',
    B2: 92,
    C2: '=IF(B2>=90,"A",IF(B2>=80,"B","C"))',
    A3: 'Alan',
    B3: 84,
    C3: '=IF(B3>=90,"A",IF(B3>=80,"B","C"))',
    A4: 'Grace',
    B4: 78,
    C4: '=IF(B4>=90,"A",IF(B4>=80,"B","C"))',
    A6: 'Average',
    B6: '=ROUND(AVERAGE(B2:B4),1)',
    A7: 'Top',
    B7: '=MAX(B2:B4)',
    A8: 'Above 80',
    B8: '=COUNTIF(B2:B4,">=80")'
});

const errors = ref<Record<string, string | number | boolean | null>>({
    A1: '=1/0',
    A2: '=NOPE(1)',
    A3: '=A3+1',
    A4: '=VLOOKUP("nothing",B1:C2,2)',
    A5: '=IFERROR(1/0,"caught")',
    B1: 'divided by nothing',
    B2: 'no such function',
    B3: 'reads itself',
    B4: 'not in the list',
    B5: 'caught instead'
});

const terms = ref<Record<string, string | number | boolean | null>>({
    A1: 'Plan',
    B1: 'Seats',
    C1: 'Monthly',
    A2: 'Team',
    B2: 12,
    C2: '=B2*9',
    A3: 'Business',
    B3: 40,
    C3: '=B3*7'
});

// The selection example keeps its own copy: two sheets over one `v-model`
// would be one sheet drawn twice.
const plans = ref<Record<string, string | number | boolean | null>>({
    A1: 'Plan',
    B1: 'Seats',
    C1: 'Monthly',
    A2: 'Team',
    B2: 12,
    C2: '=B2*9',
    A3: 'Business',
    B3: 40,
    C3: '=B3*7'
});

const budget = ref<Record<string, string | number | boolean | null>>({
    A1: 'Month',
    B1: 'Budget',
    C1: 'Spent',
    D1: 'Left',
    E1: 'Used',
    A2: 'January',
    B2: 4000,
    C2: 3120,
    D2: '=B2-C2',
    E2: '=C2/B2',
    A3: 'February',
    B3: 4000,
    C3: 4310,
    D3: '=B3-C3',
    E3: '=C3/B3',
    A4: 'March',
    B4: 4500,
    C4: 3980,
    D4: '=B4-C4',
    E4: '=C4/B4'
});

const minimal = ref<Record<string, string | number | boolean | null>>({
    A1: 'Left',
    B1: 'Centre',
    C1: 'Right',
    A2: 'Pick a cell and press a tool.'
});

const selection = ref('A1');

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
    <DemoSection title="Default" description="Type into it, drag the handle at the corner of the selection to fill, and watch the totals follow.">
        <Spreadsheet ref="sheet" v-model="invoice" :formats="formats" :rows="20" :columns="6" aria-label="Invoice" style="height: 22rem; width: 100%" @change="readDue" />
    </DemoSection>

    <DemoSection title="What comes back" description="`v-model` is what was typed, keyed by A1 — the formulas are formulas, not what they worked out to.">
        <div class="demo-stack" style="width: 100%">
            <p>
                What is kept for <code>D8</code> is <code>{{ invoice.D8 }}</code
                >, and it reads <strong>{{ due }}</strong> — edit a price above and both follow.
            </p>
        </div>
    </DemoSection>

    <DemoSection
        title="Formulas"
        description="Sixty-three of them: SUM, AVERAGE, MIN, MAX, COUNT and COUNTIF, IF and IFERROR, the text ones, INDEX, MATCH and VLOOKUP, and dates as the days every spreadsheet counts in."
    >
        <Spreadsheet v-model="scores" :rows="12" :columns="4" aria-label="Scores" style="height: 16rem; width: 100%" />
    </DemoSection>

    <DemoSection title="When a formula cannot answer" description="An error is a value: it travels through arithmetic, and `IFERROR` catches it.">
        <Spreadsheet v-model="errors" :rows="8" :columns="3" :column-widths="{ B: 180 }" aria-label="Errors" style="height: 12rem; width: 100%" />
    </DemoSection>

    <DemoSection
        title="The toolbar"
        description="`toolbar` takes groups of item names, or `false` for none; the `toolbar` slot replaces the bar with parts of your own. Every tool acts on the selected rectangle, and the pressed ones read the cell the caret is in."
    >
        <div class="demo-stack" style="width: 100%">
            <Spreadsheet v-model="budget" :rows="10" :columns="5" aria-label="Toolbar example" style="height: 14rem; width: 100%" />
            <Spreadsheet
                v-model="minimal"
                :toolbar="[['bold', 'italic'], ['alignLeft', 'alignCenter', 'alignRight']]"
                :formula-bar="false"
                :rows="6"
                :columns="4"
                aria-label="Fewer tools"
                style="height: 10rem; width: 100%"
            />
        </div>
    </DemoSection>

    <DemoSection title="Read only" description="`readonly` leaves the keyboard and the selection, and takes the typing and the fill handle away.">
        <Spreadsheet v-model="terms" readonly :formula-bar="false" :rows="6" :columns="4" aria-label="Terms" style="height: 10rem; width: 100%" />
    </DemoSection>

    <DemoSection title="Where the keyboard is" description="`selection-change` says which cell, or which rectangle, every time it moves.">
        <div class="demo-stack" style="width: 100%">
            <Spreadsheet
                v-model="plans"
                :rows="8"
                :columns="4"
                aria-label="Selection example"
                style="height: 12rem; width: 100%"
                @selection-change="selection = $event.address"
            />
            <p>
                Selected: <code>{{ selection }}</code>
            </p>
        </div>
    </DemoSection>
</template>

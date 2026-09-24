<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Spreadsheet',
    category: 'Data',
    description:
        'A spreadsheet with its own formula engine and no dependency: A1 references, sixty-three functions and recalculation of only what changed.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import DefaultSheet from './Spreadsheet/DefaultSheet.vue';
import FormulaErrors from './Spreadsheet/FormulaErrors.vue';
import Formulas from './Spreadsheet/Formulas.vue';
import ReadOnly from './Spreadsheet/ReadOnly.vue';
import TheToolbar from './Spreadsheet/TheToolbar.vue';
import WhatComesBack from './Spreadsheet/WhatComesBack.vue';
import WhereTheKeyboardIs from './Spreadsheet/WhereTheKeyboardIs.vue';
</script>

<template>
    <DemoSection title="Default" description="Type into it, drag the handle at the corner of the selection to fill, and watch the totals follow. Start a formula — `=B2*C2` — and each cell it reads is outlined where it sits."><DefaultSheet /></DemoSection>
    <DemoSection title="What comes back" description="`v-model` is what was typed, keyed by A1 — the formulas are formulas, not what they worked out to."><WhatComesBack /></DemoSection>
    <DemoSection
        title="Formulas"
        description="Sixty-three of them: SUM, AVERAGE, MIN, MAX, COUNT and COUNTIF, IF and IFERROR, the text ones, INDEX, MATCH and VLOOKUP, and dates as the days every spreadsheet counts in."
    ><Formulas /></DemoSection>
    <DemoSection title="When a formula cannot answer" description="An error is a value: it travels through arithmetic, and `IFERROR` catches it."><FormulaErrors /></DemoSection>
    <DemoSection
        title="The toolbar"
        description="`toolbar` takes groups of item names, or `false` for none; the `toolbar` slot replaces the bar with parts of your own. Every tool acts on the selected rectangle, and the pressed ones read the cell the caret is in."
    ><TheToolbar /></DemoSection>
    <DemoSection title="Read only" description="`readonly` leaves the keyboard and the selection, and takes the typing and the fill handle away."><ReadOnly /></DemoSection>
    <DemoSection title="Where the keyboard is" description="`selection-change` says which cell, or which rectangle, every time it moves."><WhereTheKeyboardIs /></DemoSection>
</template>

<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DataTable',
    category: 'Data',
    description: 'The small table: rows already in hand, sorted, striped and sized, with a sticky head. DataGrid takes over when it needs more.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import DefaultTable from './DataTable/DefaultTable.vue';
import GridLinesAndSizes from './DataTable/GridLinesAndSizes.vue';
import NothingToShow from './DataTable/NothingToShow.vue';
import OwnScroller from './DataTable/OwnScroller.vue';
import Sortable from './DataTable/Sortable.vue';
</script>

<template>
    <DemoSection title="Default" description="Rows in the order they were given. Nothing else is switched on."><DefaultTable /></DemoSection>
    <DemoSection title="Sortable" description="Click a header to sort by it: ascending, then descending, then back to the order the rows arrived in. One column at a time — a sort over several columns is DataGrid's."><Sortable /></DemoSection>
    <DemoSection title="Grid lines, sizes and a header of your own" description="A line between columns as well as between rows, tighter or roomier cells, and the header and footer as content you write."><GridLinesAndSizes /></DemoSection>
    <DemoSection title="Its own scroller" description="Given a height, the table scrolls inside it and the head stays put. The stuck head takes an opaque background, or rows would show through it."><OwnScroller /></DemoSection>
    <DemoSection title="Nothing to show" description="With no rows, one cell spans the table and says so. `empty` — the slot or `&lt;DataTable.Empty&gt;` — replaces the words."><NothingToShow /></DemoSection>
</template>

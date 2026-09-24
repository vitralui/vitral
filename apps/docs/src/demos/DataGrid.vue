<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DataGrid',
    category: 'Data',
    description:
        'A data table that sorts, filters, pages and selects, locally or on your server, with columns the reader can resize, reorder, pin and hide.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import ArrangedColumns from './DataGrid/ArrangedColumns.vue';
import DataSource from './DataGrid/DataSource.vue';
import EmptyAndLoading from './DataGrid/EmptyAndLoading.vue';
import GroupedRows from './DataGrid/GroupedRows.vue';
import MultipleSort from './DataGrid/MultipleSort.vue';
import SharedColumns from './DataGrid/SharedColumns.vue';
import SortFilterPageSelect from './DataGrid/SortFilterPageSelect.vue';
</script>

<template>
    <DemoSection title="Sort, filter, page and select" description="Click a header to sort, type under it to filter (accents are ignored: “sao” finds São Paulo), search every column at once from the header, and tick rows."><SortFilterPageSelect /></DemoSection>
    <DemoSection title="Multiple sort, single selection, grid lines" description="Sorted by country, then by balance, highest first. Ctrl-click (⌘-click) a header to add it to the sort. Click a row, or focus the rows and use the arrows and Space, to choose one. The header stays in view while the body scrolls."><MultipleSort /></DemoSection>
    <DemoSection title="Columns the reader arranges" description="Drag a header to move a column, or hold Ctrl (⌘) and press an arrow. Drag the edge of a header to set its width — the handle is in the tab order, so the arrow keys do it too, and Shift makes bigger steps. Name and Balance are pinned to the edges and stay while the rest scrolls sideways. The button opens the list of columns. Everything the reader does is one object, `columnLayout`, which an application can store and hand back."><ArrangedColumns /></DemoSection>
    <DemoSection title="Two tables, one set of columns" description="`group` is a name two tables share: rearrange a column in either and both follow, and scrolling one sideways scrolls the other. The rows are each table's own — here, this quarter above last quarter."><SharedColumns /></DemoSection>
    <DemoSection title="Grouped, the way a base is read" description="`group-by` gathers the rows by a field and puts a heading over each run, with its count and a toggle. It happens after the query, so sorting and filtering still decide which rows there are — and the rows are gathered by value rather than by adjacency, so sorting by another column keeps each group together and sorts inside it. `v-model:collapsedGroups` is what the reader shut, which an application can store."><GroupedRows /></DemoSection>
    <DemoSection title="From a data source" description="The rows come from `createDataSource({ load })`, a stand-in for a server that answers in 450 ms. The table asks it for one page at a time with the sort and the search; a slow answer that arrives after a newer one is thrown away."><DataSource /></DemoSection>
    <DemoSection title="Empty and loading"><EmptyAndLoading /></DemoSection>
</template>

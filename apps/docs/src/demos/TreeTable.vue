<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'TreeTable',
    category: 'Data',
    description: 'Rows that expand into rows, with sorting that keeps the nesting and a filter that keeps the branches leading to matches.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './TreeTable/Basic.vue';
import FilterAndPages from './TreeTable/FilterAndPages.vue';
import Totals from './TreeTable/Totals.vue';
</script>

<template>
    <DemoSection title="Basic" class="stack"><Basic /></DemoSection>
    <DemoSection title="Filter and pages" class="stack"><FilterAndPages /></DemoSection>
    <DemoSection title="Totals" description="A `<Column>` with `aggregate` — `sum`, `avg`, `min`, `max`, `count` or a function — draws on each row with rows under it the total of the rows its branches end in, in place of the row's own value, and over what a filter left. Every cell of that row gets the totals in its `data`, so a column worked out from them, like the share used here, holds on a department as on a line. `expandAll()` and `collapseAll()` open and close the whole tree." class="stack"><Totals /></DemoSection>
</template>

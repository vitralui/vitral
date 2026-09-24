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
</script>

<template>
    <DemoSection title="Basic" class="stack"><Basic /></DemoSection>
    <DemoSection title="Filter and pages" class="stack"><FilterAndPages /></DemoSection>
</template>

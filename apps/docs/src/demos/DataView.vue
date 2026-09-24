<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DataView',
    category: 'Data',
    description: 'Sorting and paging over your own template per item, shown as a list or a grid.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import ListAndGrid from './DataView/ListAndGrid.vue';
</script>

<template>
    <DemoSection title="List and grid" class="stack"><ListAndGrid /></DemoSection>
</template>

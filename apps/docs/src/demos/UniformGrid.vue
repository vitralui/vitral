<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'UniformGrid',
    category: 'Layout',
    description: 'A grid of equal cells that works out its rows or columns from the number of children.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import ColumnsGiven from './UniformGrid/ColumnsGiven.vue';
import FirstColumn from './UniformGrid/FirstColumn.vue';
import SquareFromChildren from './UniformGrid/SquareFromChildren.vue';
</script>

<template>
    <DemoSection title="Square, from the children" description="Neither rows nor columns: the grid is the smallest square that holds every child. Add some and watch it grow."><SquareFromChildren /></DemoSection>
    <DemoSection title="Columns given, rows worked out" description="columns=&quot;4&quot; with ten children makes three rows, each as tall as the tallest cell."><ColumnsGiven /></DemoSection>
    <DemoSection title="FirstColumn" description="A month: seven columns, and first-column set to the weekday the month starts on."><FirstColumn /></DemoSection>
</template>

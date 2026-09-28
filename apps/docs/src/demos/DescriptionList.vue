<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DescriptionList',
    category: 'Data',
    description: 'Facts about one thing as labels and values — an order, a profile — in a real <dl>, in columns that fold into one when the list is narrow.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './DescriptionList/Basic.vue';
import Bordered from './DescriptionList/Bordered.vue';
import Horizontal from './DescriptionList/Horizontal.vue';
</script>

<template>
    <DemoSection title="Columns" description="The columns answer to the list's own width, not the window's: in a narrow panel they fold into one."><Basic /></DemoSection>
    <DemoSection title="Bordered" description="Each fact in a cell of one block, with a value drawn from a slot and an action beside the title."><Bordered /></DemoSection>
    <DemoSection title="Label beside the value"><Horizontal /></DemoSection>
</template>

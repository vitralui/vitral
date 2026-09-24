<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'OrderList',
    category: 'Data',
    description: 'A list the reader puts in order, with buttons, the keyboard or drag and drop.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './OrderList/Basic.vue';
</script>

<template>
    <DemoSection title="Basic" class="stack"><Basic /></DemoSection>
</template>

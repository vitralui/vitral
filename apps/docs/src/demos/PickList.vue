<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'PickList',
    category: 'Data',
    description: 'Two lists and the moves between them, with buttons, the keyboard or a double click, and reordering within each.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './PickList/Basic.vue';
</script>

<template>
    <DemoSection title="Basic" class="stack"><Basic /></DemoSection>
</template>

<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'OrganizationChart',
    category: 'Data',
    description: 'A tree drawn as a chart, with nodes that fold and open, can be selected, and take a template per node type.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import SelectableAndCollapsible from './OrganizationChart/SelectableAndCollapsible.vue';
</script>

<template>
    <DemoSection title="Selectable and collapsible" class="stack"><SelectableAndCollapsible /></DemoSection>
</template>

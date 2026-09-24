<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Tree',
    category: 'Data',
    description: 'Hierarchical data with branches that open and close, selection by click or checkbox, a filter, and children loaded on demand.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Checkboxes from './Tree/Checkboxes.vue';
import FilterTree from './Tree/FilterTree.vue';
import LazyChildren from './Tree/LazyChildren.vue';
import SingleSelection from './Tree/SingleSelection.vue';
</script>

<template>
    <DemoSection title="Single selection, custom content" description="The default slot draws each node: here, its size beside the name."><SingleSelection /></DemoSection>
    <DemoSection title="Checkboxes" description="Checking a branch checks everything under it; a branch with some of its children checked is mixed (aria-checked=&quot;mixed&quot;). Ísland is disabled."><Checkboxes /></DemoSection>
    <DemoSection title="Filter" description="Matches stay, with the branches that lead to them opened. “evora” finds Évora."><FilterTree /></DemoSection>
    <DemoSection title="Lazy children" description="Each region is a branch (`leaf: false`) with no children yet; opening it emits `node-expand`, and the app loads them."><LazyChildren /></DemoSection>
</template>

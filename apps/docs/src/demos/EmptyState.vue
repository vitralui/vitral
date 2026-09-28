<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'EmptyState',
    category: 'Messages',
    description: 'What to show where there is nothing yet, or where something just finished: an icon, a line saying what happened, and what to do next.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './EmptyState/Basic.vue';
import Results from './EmptyState/Results.vue';
import Compact from './EmptyState/Compact.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Results" description="A `severity` turns an absence into an outcome: the icon and its colour follow it."><Results /></DemoSection>
    <DemoSection title="Small, and aligned to the start" description="For a panel or a table with no rows: `size=&quot;small&quot;` and `align=&quot;start&quot;`."><Compact /></DemoSection>
</template>

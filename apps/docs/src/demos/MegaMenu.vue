<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'MegaMenu',
    category: 'Menu',
    description: "A menubar whose items open wide panels of grouped links in columns, like this site's own top bar."
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Horizontal from './MegaMenu/Horizontal.vue';
import Vertical from './MegaMenu/Vertical.vue';
</script>

<template>
    <DemoSection title="Horizontal" class="stack"><Horizontal /></DemoSection>
    <DemoSection title="Vertical"><Vertical /></DemoSection>
</template>

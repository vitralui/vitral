<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'PanelMenu',
    category: 'Menu',
    description: 'Sections of navigation that expand in place, each a tree of its items, for a sidebar.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './PanelMenu/Basic.vue';
import SeveralOpen from './PanelMenu/SeveralOpen.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Several open"><SeveralOpen /></DemoSection>
</template>

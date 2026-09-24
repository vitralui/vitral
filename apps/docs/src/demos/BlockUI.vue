<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'BlockUI',
    category: 'Messages',
    description: 'A veil over a region, or the whole page, while it is busy, making what is under it inert and saying why.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Region from './BlockUI/Region.vue';
import WholePage from './BlockUI/WholePage.vue';
</script>

<template>
    <DemoSection title="A region" class="stack"><Region /></DemoSection>
    <DemoSection title="The whole page"><WholePage /></DemoSection>
</template>

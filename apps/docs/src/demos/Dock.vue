<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Dock',
    category: 'Menu',
    description: 'A strip of large icons that grow under the pointer, each labelled with a tooltip.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Bottom from './Dock/Bottom.vue';
import Left from './Dock/Left.vue';
</script>

<template>
    <DemoSection title="Bottom" class="stack"><Bottom /></DemoSection>
    <DemoSection title="Left"><Left /></DemoSection>
</template>

<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Image',
    category: 'Media',
    description: 'An image that can open in a viewer over the page, with rotate and zoom.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import BasicImage from './Image/BasicImage.vue';
import Preview from './Image/Preview.vue';
</script>

<template>
    <DemoSection title="Basic"><BasicImage /></DemoSection>
    <DemoSection title="Preview"><Preview /></DemoSection>
</template>

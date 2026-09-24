<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'FileUpload',
    category: 'Media',
    description: 'A file input drawn as a button, a drop zone and a queue, checking type, size and count, with upload progress.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Advanced from './FileUpload/Advanced.vue';
import Basic from './FileUpload/Basic.vue';
</script>

<template>
    <DemoSection title="Advanced" class="stack"><Advanced /></DemoSection>
    <DemoSection title="Basic"><Basic /></DemoSection>
</template>

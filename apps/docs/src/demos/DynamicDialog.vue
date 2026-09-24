<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DynamicDialog',
    category: 'Overlay',
    description: 'A dialog opened from code with a component as its content, which receives data and closes with a result.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './DynamicDialog/Basic.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
</template>

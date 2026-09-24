<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Fieldset',
    category: 'Panel',
    description: 'A native fieldset that names the controls inside it, and can collapse behind its legend.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Fieldset/Basic.vue';
import Toggleable from './Fieldset/Toggleable.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Toggleable"><Toggleable /></DemoSection>
</template>

<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ButtonGroup',
    category: 'Button',
    description: 'Buttons that belong together, joined into one named control, each keeping its own tab stop.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './ButtonGroup/Basic.vue';
import Outlined from './ButtonGroup/Outlined.vue';
import Vertical from './ButtonGroup/Vertical.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Outlined and secondary"><Outlined /></DemoSection>
    <DemoSection title="Vertical"><Vertical /></DemoSection>
</template>

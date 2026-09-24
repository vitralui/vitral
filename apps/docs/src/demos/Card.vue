<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Card',
    category: 'Panel',
    description: 'A container for one piece of content: an optional header image, a title and subtitle, the content and a footer of actions.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Card/Basic.vue';
import HeaderAndFooter from './Card/HeaderAndFooter.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Header, subtitle and footer"><HeaderAndFooter /></DemoSection>
</template>

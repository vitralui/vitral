<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Message',
    category: 'Messages',
    description: 'An inline message with a title, an action and a close button, in every severity.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import ActionAndClose from './Message/ActionAndClose.vue';
import InfoBar from './Message/InfoBar.vue';
import Variants from './Message/Variants.vue';
</script>

<template>
    <DemoSection title="InfoBar" description="Title and message share a line while they fit."><InfoBar /></DemoSection>
    <DemoSection title="Action and close" description="The action slot holds a button or link; `closable` adds a close button that emits `close`."><ActionAndClose /></DemoSection>
    <DemoSection title="Variants" description="`outlined` and `simple`; every severity works with each."><Variants /></DemoSection>
</template>

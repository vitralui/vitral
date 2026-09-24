<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Panel',
    category: 'Panel',
    description: 'A titled container that can collapse behind its header.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Panel/Basic.vue';
import CustomToggleIcon from './Panel/CustomToggleIcon.vue';
import HeaderActionsAndFooter from './Panel/HeaderActionsAndFooter.vue';
import Toggleable from './Panel/Toggleable.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Toggleable (Expander)" class="stack"><Toggleable /></DemoSection>
    <DemoSection title="Header actions and footer"><HeaderActionsAndFooter /></DemoSection>
    <DemoSection title="Custom toggle icon, starting collapsed"><CustomToggleIcon /></DemoSection>
</template>

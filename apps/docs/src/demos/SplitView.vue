<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'SplitView',
    category: 'Layout',
    description: 'A pane beside the content, inline or as an overlay, that can shrink to a strip of icons when closed.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import InlineOnTheRight from './SplitView/InlineOnTheRight.vue';
import NavigationShell from './SplitView/NavigationShell.vue';
</script>

<template>
    <DemoSection title="NavigationView shell" description="The hamburger toggles the pane. Switch the display mode to compare: in the compact modes the closed pane keeps its icons."><NavigationShell /></DemoSection>
    <DemoSection title="Inline, on the right" description="A details pane: display-mode=&quot;inline&quot; placement=&quot;right&quot;, open. Closing it gives the list the whole width."><InlineOnTheRight /></DemoSection>
</template>

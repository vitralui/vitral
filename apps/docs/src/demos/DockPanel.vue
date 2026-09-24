<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DockPanel',
    category: 'Layout',
    description: 'Docks regions to its top, bottom, left and right edges and gives what is left to the fill; the order decides who wins the corners.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import ApplicationFrame from './DockPanel/ApplicationFrame.vue';
import OnlyWhatIsThere from './DockPanel/OnlyWhatIsThere.vue';
</script>

<template>
    <DemoSection title="An application frame" description="A toolbar, a status bar, a file tree and a properties pane around an editor."><ApplicationFrame /></DemoSection>
    <DemoSection title="Only what is there" description="Just a left slot and the fill: no tracks, and no gaps, for the edges that are absent."><OnlyWhatIsThere /></DemoSection>
</template>

<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Tabs',
    category: 'Panel',
    description: 'Views that share one place on the page, switched by a list of tabs.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Tabs/Basic.vue';
import ManualActivation from './Tabs/ManualActivation.vue';
import Scrollable from './Tabs/Scrollable.vue';
import Styles from './Tabs/Styles.vue';
import VerticalTabs from './Tabs/VerticalTabs.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Scrollable" description="`scrollable` lets tabs that do not fit scroll along the strip, across or upright. The buttons move nearly a page at a time; `scroll-buttons` puts one at each end (`sides`, the default, each shown only while there is more that way), both together at the `start` or the `end`, or `none`. The selected tab is always brought into view — press End on the tabs to see it follow."><Scrollable /></DemoSection>
    <DemoSection title="Vertical"><VerticalTabs /></DemoSection>
    <DemoSection title="Styles" description="One component, five looks: a tinted selection, an underline as wide as the tab, filled pills, a segmented control and tabs with an icon and a count. Each is the component's tokens changed for one instance with `dt` — the segmented track adds a style through `pt` — so a preset gives every Tabs the same look by setting the same tokens."><Styles /></DemoSection>
    <DemoSection title="Manual activation" description="With `select-on-focus` off, the arrows only move focus; Enter or Space selects."><ManualActivation /></DemoSection>
</template>

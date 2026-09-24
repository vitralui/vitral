<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Tooltip',
    category: 'Overlay',
    description: 'The v-tooltip directive: a hint shown on hover and on keyboard focus, which describes the element it sits on.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import OnAField from './Tooltip/OnAField.vue';
import Placement from './Tooltip/Placement.vue';
import TooltipOptions from './Tooltip/TooltipOptions.vue';
</script>

<template>
    <DemoSection title="Placement" description="Modifiers pick the side: `.top` (the default), `.bottom`, `.left`, `.right`."><Placement /></DemoSection>
    <DemoSection title="Options" description="An object sets the text, placement and delays, and can disable it."><TooltipOptions /></DemoSection>
    <DemoSection title="On a field" description="Focus the box with Tab: the tooltip shows, and the input is described by it."><OnAField /></DemoSection>
</template>

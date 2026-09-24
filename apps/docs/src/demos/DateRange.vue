<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DateRange',
    category: 'Form',
    description: 'Two dates and the days between them, picked on two months side by side or one, with the span drawn before it is committed.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Inline from './DateRange/Inline.vue';
import OneMonth from './DateRange/OneMonth.vue';
import OtherMonths from './DateRange/OtherMonths.vue';
import Presets from './DateRange/Presets.vue';
import ShapeOfIt from './DateRange/ShapeOfIt.vue';
import TwoMonths from './DateRange/TwoMonths.vue';
</script>

<template>
    <DemoSection title="Two months" description="The default. Pick a start, then an end; the band between them follows the pointer before you commit. Each calendar stops at its own month — the days either side are left blank rather than repeating the month next door."><TwoMonths /></DemoSection>
    <DemoSection title="One month" description="The same range in a single calendar, for a form with no room for two. With no neighbour to repeat, the days either side of the month come back."><OneMonth /></DemoSection>
    <DemoSection title="With the spans people ask for by name" description="The footer is a slot: presets, a count of nights, whatever the form needs."><Presets /></DemoSection>
    <DemoSection title="Inline" description="Without the text box or the popup."><Inline /></DemoSection>
    <DemoSection title="Showing the neighbouring days anyway" description="`show-other-months` overrides what the number of calendars decided. Two months with their edges drawn: February’s last days appear again as March’s first, and a range spanning the boundary is painted twice."><OtherMonths /></DemoSection>
    <DemoSection title="The shape of it"><ShapeOfIt /></DemoSection>
</template>

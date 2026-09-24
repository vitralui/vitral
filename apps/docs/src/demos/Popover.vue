<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Popover',
    category: 'Overlay',
    description: 'A non-modal dialog anchored to what opened it, closing on Escape, a press outside or tabbing out.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Placement from './Popover/Placement.vue';
import Share from './Popover/Share.vue';
</script>

<template>
    <DemoSection title="Share" description="A flyout with a field and a button in it."><Share /></DemoSection>
    <DemoSection title="Placement" description="`placement` picks the side; it flips when there is no room."><Placement /></DemoSection>
</template>

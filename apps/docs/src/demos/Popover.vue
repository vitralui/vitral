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
import Arrows from './Popover/Arrows.vue';
import Placement from './Popover/Placement.vue';
import Share from './Popover/Share.vue';
</script>

<template>
    <DemoSection title="Share" description="A flyout with a field and a button in it."><Share /></DemoSection>
    <DemoSection title="Placement" description="`placement` picks the side; it flips when there is no room."><Placement /></DemoSection>
    <DemoSection title="Arrows" description="Off by default: `arrow` gives a Popover, a ConfirmPopup, a HoverCard, a popup Menu or TieredMenu and a tooltip a pointer to what opened it, in the panel's own fill and border. It sits on whichever side the panel ends up — flipped for room included. `overlayArrow: true` in the plugin turns it on for all of them, and `arrow: false` still turns it off for one."><Arrows /></DemoSection>
</template>

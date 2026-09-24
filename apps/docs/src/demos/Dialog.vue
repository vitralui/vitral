<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Dialog',
    category: 'Overlay',
    description: 'A window over the page, modal or not, that takes focus in, keeps it inside and returns it when it closes.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Dialog/Basic.vue';
import Maximizable from './Dialog/Maximizable.vue';
import Modeless from './Dialog/Modeless.vue';
import OverlaysInside from './Dialog/OverlaysInside.vue';
import Position from './Dialog/Position.vue';
</script>

<template>
    <DemoSection title="Basic" description="The header names the dialog; the footer is the button band."><Basic /></DemoSection>
    <DemoSection title="Position" description="The dialog sits in the centre, along an edge or in a corner, and slides in from there."><Position /></DemoSection>
    <DemoSection title="Maximizable" description="A button fills the viewport with the dialog; its name switches between Maximize and Restore."><Maximizable /></DemoSection>
    <DemoSection title="Modeless" description="`modal: false` keeps the page usable: no mask, no focus trap, no scroll lock. Escape still closes it."><Modeless /></DemoSection>
    <DemoSection title="Overlays inside" description="Open the select, then press Escape: the select closes first, the dialog stays."><OverlaysInside /></DemoSection>
</template>

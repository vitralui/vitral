<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ColorPicker',
    category: 'Form',
    description: 'A swatch that opens a colour panel, with a value in hex, RGB or HSB and an optional opacity slider.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Disabled from './ColorPicker/Disabled.vue';
import HsbNoInput from './ColorPicker/HsbNoInput.vue';
import Inline from './ColorPicker/Inline.vue';
import Opacity from './ColorPicker/Opacity.vue';
import OpacityInline from './ColorPicker/OpacityInline.vue';
import Popup from './ColorPicker/Popup.vue';
</script>

<template>
    <DemoSection title="Popup"><Popup /></DemoSection>
    <DemoSection title="Inline"><Inline /></DemoSection>
    <DemoSection title="HSB, without the text box"><HsbNoInput /></DemoSection>
    <DemoSection title="Opacity" description="The value grows two hex digits. Drag the slider, or focus it and use the arrows; Shift moves in tens."><Opacity /></DemoSection>
    <DemoSection title="Opacity, inline" description="The chequer is what transparent looks like: it sits under the slider's gradient, the preview and the swatch."><OpacityInline /></DemoSection>
    <DemoSection title="Disabled"><Disabled /></DemoSection>
</template>

<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ColorPicker',
    category: 'Form',
    description:
        'A swatch that opens a panel: a saturation and brightness area and a hue strip, both WAI-ARIA sliders (arrows move, Shift moves in tens, Page Up/Down and Home/End jump), and the hex value in a text box. v-model is hex, RGB or HSB.'
};
</script>

<script setup lang="ts">
import { ColorPicker } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const hex = ref('6466f1');
const rgb = ref({ r: 16, g: 185, b: 129 });
const hsb = ref({ h: 330, s: 70, b: 90 });
</script>

<template>
    <DemoSection title="Popup">
        <div class="demo-field" style="min-width: 0">
            <span id="cp-accent">Accent</span>
            <ColorPicker v-model="hex" aria-labelledby="cp-accent" />
            <span class="demo-hint">Value: {{ hex }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Inline">
        <ColorPicker v-model="rgb" inline format="rgb" aria-label="Highlight colour" />
        <span class="demo-hint">RGB: {{ rgb }}</span>
    </DemoSection>
    <DemoSection title="HSB, without the text box">
        <ColorPicker v-model="hsb" format="hsb" :show-input="false" aria-label="Tint" />
        <span class="demo-hint">HSB: {{ hsb }}</span>
    </DemoSection>
    <DemoSection title="Disabled">
        <ColorPicker model-value="aaaaaa" disabled aria-label="Disabled colour" />
    </DemoSection>
</template>

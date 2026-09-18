<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ColorPicker',
    category: 'Form',
    description:
        'A swatch that opens a panel: a saturation and brightness area and a hue strip, both WAI-ARIA sliders (arrows move, Shift moves in tens, Page Up/Down and Home/End jump), and the hex value in a text box. v-model is hex, RGB or HSB. With `alpha` it grows an opacity slider and the value carries it — eight hex digits, or an `a` beside the channels — and everything painted with it sits on a chequer, because half transparent over a white panel is otherwise indistinguishable from pale.'
};
</script>

<script setup lang="ts">
import { ColorPicker } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const hex = ref('6466f1');
const rgb = ref({ r: 16, g: 185, b: 129 });
const hsb = ref({ h: 330, s: 70, b: 90 });
const overlay = ref('3366994d');
const glass = ref({ r: 16, g: 185, b: 129, a: 0.35 });
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
    <DemoSection title="Opacity" description="The value grows two hex digits. Drag the slider, or focus it and use the arrows; Shift moves in tens.">
        <div class="demo-field" style="min-width: 0">
            <span id="cp-overlay">Overlay</span>
            <ColorPicker v-model="overlay" alpha aria-labelledby="cp-overlay" />
            <span class="demo-hint">Value: {{ overlay }}</span>
        </div>
        <div class="demo-field" style="min-width: 0">
            <span id="cp-glass">Tint, as RGB</span>
            <ColorPicker v-model="glass" alpha format="rgb" aria-labelledby="cp-glass" />
            <span class="demo-hint">Value: {{ glass }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Opacity, inline" description="The chequer is what transparent looks like: it sits under the slider's gradient, the preview and the swatch.">
        <ColorPicker v-model="overlay" alpha inline aria-label="Overlay colour" />
    </DemoSection>
    <DemoSection title="Disabled">
        <ColorPicker model-value="aaaaaa" disabled aria-label="Disabled colour" />
    </DemoSection>
</template>

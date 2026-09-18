<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Slider',
    category: 'Form',
    description:
        'Pick a value, or a range, by dragging along a track. Each thumb is a WAI-ARIA slider: arrows step, Page Up/Down move ten steps, Home/End go to the ends, and a range\'s thumbs stop at each other. A press on the track jumps the nearer thumb there. A thin track, and a thumb whose accent dot grows under the pointer.'
};
</script>

<script setup lang="ts">
import { Slider } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const volume = ref(40);
const opacity = ref(0.6);
const price = ref([200, 750]);
const bass = ref(30);
const treble = ref(70);
const temperature = ref(21);
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field slider-demo">
            <span id="sl-volume">Volume</span>
            <Slider v-model="volume" aria-labelledby="sl-volume" />
            <span class="demo-hint">Value: {{ volume }}</span>
        </div>
        <div class="demo-field slider-demo">
            <span id="sl-opacity">Opacity</span>
            <Slider v-model="opacity" :min="0" :max="1" :step="0.05" aria-labelledby="sl-opacity" :format-value="(v: number) => `${Math.round(v * 100)}%`" />
            <span class="demo-hint">Value: {{ opacity }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Range" description="v-model is [start, end]. One name covers both thumbs, which are told apart as minimum and maximum.">
        <div class="demo-field slider-demo">
            <span id="sl-price">Price</span>
            <Slider v-model="price" range :min="0" :max="1000" :step="10" aria-labelledby="sl-price" :format-value="(v: number) => `R$ ${v}`" />
            <span class="demo-hint">R$ {{ price[0] }} – R$ {{ price[1] }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Vertical" description="The minimum is at the bottom; Up and Right both increase.">
        <Slider v-model="bass" orientation="vertical" aria-label="Bass" />
        <Slider v-model="treble" orientation="vertical" aria-label="Treble" />
        <Slider v-model="temperature" orientation="vertical" :min="16" :max="30" :step="0.5" aria-label="Temperature" :format-value="(v: number) => `${v} °C`" />
        <span class="demo-hint">Bass {{ bass }} · Treble {{ treble }} · {{ temperature }} °C</span>
    </DemoSection>
    <DemoSection title="Disabled">
        <div class="demo-field slider-demo">
            <Slider :model-value="60" disabled aria-label="Disabled" />
        </div>
        <div class="demo-field slider-demo">
            <Slider :model-value="[25, 75]" range disabled :aria-label="['Disabled start', 'Disabled end']" />
        </div>
    </DemoSection>
</template>

<style scoped>
.slider-demo {
    width: 20rem;
}
</style>

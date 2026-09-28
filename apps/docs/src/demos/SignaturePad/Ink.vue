<script setup lang="ts">
import { Label, SignaturePad, Slider, ToggleSwitch } from '@vitral/vue';
import { ref } from 'vue';

const width = ref(3);
const thinning = ref(0.6);
const smoothing = ref(0.5);
const taper = ref(0);
const pressure = ref(true);
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 1.5rem; align-items: start">
        <SignaturePad :pen-width="width" :thinning="thinning" :smoothing="smoothing" :taper="taper" :pressure="pressure" aria-label="Signature" height="12rem" />
        <div style="display: grid; gap: 1rem">
            <div style="display: grid; gap: 0.5rem">
                <Label id="ink-width">Width: {{ width }}</Label>
                <Slider v-model="width" :min="1" :max="8" :step="0.5" aria-labelledby="ink-width" />
            </div>
            <div style="display: grid; gap: 0.5rem">
                <Label id="ink-thinning">Thinning: {{ thinning }}</Label>
                <Slider v-model="thinning" :min="0" :max="1" :step="0.05" aria-labelledby="ink-thinning" />
            </div>
            <div style="display: grid; gap: 0.5rem">
                <Label id="ink-smoothing">Smoothing: {{ smoothing }}</Label>
                <Slider v-model="smoothing" :min="0" :max="1" :step="0.05" aria-labelledby="ink-smoothing" />
            </div>
            <div style="display: grid; gap: 0.5rem">
                <Label id="ink-taper">Taper: {{ taper }}</Label>
                <Slider v-model="taper" :min="0" :max="80" :step="5" aria-labelledby="ink-taper" />
            </div>
            <label style="display: flex; gap: 0.5rem; align-items: center">
                <ToggleSwitch v-model="pressure" />
                A pen's own pressure
            </label>
        </div>
    </div>
</template>

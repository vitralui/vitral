<script setup lang="ts">
import { Slider } from '@vitral/vue';
import { ref } from 'vue';

const bass = ref(30);
const treble = ref(70);
const temperature = ref(21);
</script>

<template>
    <Slider v-model="bass" orientation="vertical" aria-label="Bass" />
    <Slider v-model="treble" orientation="vertical" aria-label="Treble" />
    <Slider v-model="temperature" orientation="vertical" :min="16" :max="30" :step="0.5" aria-label="Temperature" :format-value="(v: number) => `${v} °C`" />
    <small style="color: var(--vt-text-muted-color)">Bass {{ bass }} · Treble {{ treble }} · {{ temperature }} °C</small>
</template>

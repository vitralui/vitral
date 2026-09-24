<script setup lang="ts">
import { Slider, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const volume = ref(40);
const opacity = ref(0.6);
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" class="slider-demo">
            <span id="sl-volume">Volume</span>
            <Slider v-model="volume" aria-labelledby="sl-volume" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ volume }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem" class="slider-demo">
            <span id="sl-opacity">Opacity</span>
            <Slider v-model="opacity" :min="0" :max="1" :step="0.05" aria-labelledby="sl-opacity" :format-value="(v: number) => `${Math.round(v * 100)}%`" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ opacity }}</small>
        </StackPanel>
    </StackPanel>
</template>

<style scoped>
.slider-demo {
    width: 20rem;
}
</style>

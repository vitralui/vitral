<script setup lang="ts">
import { ColorPicker, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const overlay = ref('3366994d');
const glass = ref({ r: 16, g: 185, b: 129, a: 0.35 });
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem">
            <span id="cp-overlay">Overlay</span>
            <ColorPicker v-model="overlay" alpha aria-labelledby="cp-overlay" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ overlay }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem">
            <span id="cp-glass">Tint, as RGB</span>
            <ColorPicker v-model="glass" alpha format="rgb" aria-labelledby="cp-glass" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ glass }}</small>
        </StackPanel>
    </StackPanel>
</template>

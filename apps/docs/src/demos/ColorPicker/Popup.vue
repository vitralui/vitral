<script setup lang="ts">
import { ColorPicker, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const hex = ref('6466f1');
</script>

<template>
    <StackPanel spacing="0.375rem">
        <span id="cp-accent">Accent</span>
        <ColorPicker v-model="hex" aria-labelledby="cp-accent" />
        <small style="color: var(--vt-text-muted-color)">Value: {{ hex }}</small>
    </StackPanel>
</template>

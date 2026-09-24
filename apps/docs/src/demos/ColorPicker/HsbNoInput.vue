<script setup lang="ts">
import { ColorPicker } from '@vitral/vue';
import { ref } from 'vue';

const hsb = ref({ h: 330, s: 70, b: 90 });
</script>

<template>
    <ColorPicker v-model="hsb" format="hsb" :show-input="false" aria-label="Tint" />
    <small style="color: var(--vt-text-muted-color)">HSB: {{ hsb }}</small>
</template>

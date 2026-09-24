<script setup lang="ts">
import { ColorPicker } from '@vitral/vue';
import { ref } from 'vue';

const rgb = ref({ r: 16, g: 185, b: 129 });
</script>

<template>
    <ColorPicker v-model="rgb" inline format="rgb" aria-label="Highlight colour" />
    <small style="color: var(--vt-text-muted-color)">RGB: {{ rgb }}</small>
</template>

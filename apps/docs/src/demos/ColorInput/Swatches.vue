<script setup lang="ts">
import { ColorInput } from '@vitral/vue';
import { ref } from 'vue';

const color = ref<string | null>(null);
const palette = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#00897b', '#1e88e5', '#3949ab', '#8e24aa', '#6d4c41', '#546e7a'];
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 18rem">
        <label for="ci-swatches">Subject colour</label>
        <ColorInput id="ci-swatches" v-model="color" :swatches="palette" clearable placeholder="Uses the area's colour" />
    </div>
</template>

<script setup lang="ts">
import { ToggleButton } from '@vitral/vue';
import { ref } from 'vue';

const bold = ref(false);
</script>

<template>
    <div style="display: grid; gap: 0.5rem; justify-items: start">
        <ToggleButton v-model="bold" on-label="Bold" off-label="Bold" />
        <small style="color: var(--vt-text-muted-color)">pressed: {{ bold }}</small>
    </div>
</template>

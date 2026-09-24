<script setup lang="ts">
import { Knob } from '@vitral/vue';
import { ref } from 'vue';

const temperature = ref(21);
const balance = ref(0);
</script>

<template>
    <Knob v-model="temperature" :min="16" :max="30" :step="0.5" :size="140" :stroke-width="10" value-template="{value}°C" aria-label="Temperature" />
    <Knob v-model="balance" :min="-50" :max="50" value-color="var(--vt-help-color)" aria-label="Balance" />
</template>

<script setup lang="ts">
import { ToggleSwitch } from '@vitral/vue';
import { ref } from 'vue';

const wifi = ref(true);
const bluetooth = ref(false);
</script>

<template>
    <ToggleSwitch v-model="wifi" label="Wi-Fi" show-state-label />
    <ToggleSwitch v-model="bluetooth" label="Bluetooth" show-state-label />
</template>

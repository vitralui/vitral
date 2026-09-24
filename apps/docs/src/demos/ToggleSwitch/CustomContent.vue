<script setup lang="ts">
import { ToggleSwitch } from '@vitral/vue';
import { ref } from 'vue';

const dark = ref(false);
const sync = ref(false);
</script>

<template>
    <ToggleSwitch v-model="dark" label="Appearance" on-label="Dark" off-label="Light" />
    <ToggleSwitch v-model="sync" aria-label="Sync" on-label="Syncing" off-label="Paused" />
</template>

<script setup lang="ts">
import { ToggleSwitch } from '@vitral/vue';
</script>

<template>
    <ToggleSwitch :model-value="false" label="Invalid" invalid show-state-label />
    <ToggleSwitch :model-value="false" label="Disabled" disabled show-state-label />
    <ToggleSwitch :model-value="true" label="Disabled on" disabled show-state-label />
</template>

<script setup lang="ts">
import { ToggleButton } from '@vitral/vue';
</script>

<template>
    <ToggleButton :model-value="true" on-label="Small" off-label="Small" size="small" />
    <ToggleButton :model-value="false" on-label="Large" off-label="Large" size="large" />
    <ToggleButton :model-value="false" on-label="Invalid" off-label="Invalid" invalid />
    <ToggleButton :model-value="true" on-label="Disabled" off-label="Disabled" disabled />
</template>

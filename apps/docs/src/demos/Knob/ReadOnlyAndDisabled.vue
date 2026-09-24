<script setup lang="ts">
import { Knob } from '@vitral/vue';
</script>

<template>
    <Knob :model-value="75" readonly aria-label="Battery" value-template="{value}%" />
    <Knob :model-value="30" disabled aria-label="Disabled" />
</template>

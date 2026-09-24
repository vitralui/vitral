<script setup lang="ts">
import { ProgressSpinner } from '@vitral/vue';
</script>

<template>
    <ProgressSpinner size="1rem" :stroke-width="4" />
    <ProgressSpinner />
    <ProgressSpinner size="3rem" :stroke-width="2.5" />
    <ProgressSpinner size="4rem" :stroke-width="2" animation-duration="3s" aria-label="Loading slowly" />
</template>

<script setup lang="ts">
import { ProgressSpinner } from '@vitral/vue';
</script>

<template>
    <ProgressSpinner :value="25" aria-label="25% done" />
    <ProgressSpinner :value="50" aria-label="Half done" />
    <ProgressSpinner :value="80" size="3rem" aria-label="80% done" />
</template>

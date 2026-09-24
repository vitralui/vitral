<script setup lang="ts">
import { Rating } from '@vitral/vue';
</script>

<template>
    <Rating :model-value="4" readonly aria-label="Average rating" />
    <Rating :model-value="2" disabled aria-label="Disabled rating" />
</template>

<script setup lang="ts">
import { Textarea } from '@vitral/vue';
</script>

<template>
    <Textarea placeholder="Small" size="small" :rows="2" aria-label="Small" />
    <Textarea placeholder="Filled" variant="filled" :rows="2" aria-label="Filled" />
    <Textarea placeholder="Invalid" invalid :rows="2" aria-label="Invalid" />
    <Textarea placeholder="Disabled" disabled :rows="2" aria-label="Disabled" />
    <Textarea model-value="Read only" readonly :rows="2" aria-label="Read only" />
</template>

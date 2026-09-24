<script setup lang="ts">
import { InputText } from '@vitral/vue';
</script>

<template>
    <InputText placeholder="Small" size="small" aria-label="Small" />
    <InputText placeholder="Normal" aria-label="Normal" />
    <InputText placeholder="Large" size="large" aria-label="Large" />
    <InputText placeholder="Filled" variant="filled" aria-label="Filled" />
    <InputText placeholder="Invalid" invalid aria-label="Invalid" />
    <InputText placeholder="Disabled" disabled aria-label="Disabled" />
    <InputText model-value="Read only" readonly aria-label="Read only" />
</template>

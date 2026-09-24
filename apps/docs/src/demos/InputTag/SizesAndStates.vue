<script setup lang="ts">
import { InputTag, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const keywords = ref(['accessible']);
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%; max-width: 30rem">
        <InputTag v-model="keywords" size="small" aria-label="Small" fluid />
        <InputTag v-model="keywords" aria-label="Default" fluid />
        <InputTag v-model="keywords" size="large" aria-label="Large" fluid />
        <InputTag v-model="keywords" variant="filled" aria-label="Filled" fluid />
        <InputTag v-model="keywords" invalid aria-label="Invalid" fluid />
        <InputTag v-model="keywords" disabled aria-label="Disabled" fluid />
        <InputTag v-model="keywords" readonly aria-label="Read-only" fluid />
    </StackPanel>
</template>

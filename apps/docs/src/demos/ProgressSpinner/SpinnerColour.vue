<script setup lang="ts">
import { ProgressSpinner } from '@vitral/vue';
</script>

<template>
    <ProgressSpinner :dt="{ progressspinner: { color: '{success.color}' } }" />
    <ProgressSpinner :dt="{ progressspinner: { color: '{danger.color}' } }" />
    <ProgressSpinner :dt="{ progressspinner: { color: '{warn.color}' } }" />
</template>

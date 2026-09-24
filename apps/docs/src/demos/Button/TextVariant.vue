<script setup lang="ts">
import { Button } from '@vitral/vue';

const severities = ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'help', 'contrast'] as const;
</script>

<template>
    <Button v-for="s in severities" :key="s" :label="s" :severity="s" variant="text" />
</template>

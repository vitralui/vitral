<script setup lang="ts">
import { Badge } from '@vitral/vue';

const severities = ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'help', 'contrast'] as const;
</script>

<template>
    <Badge v-for="(s, i) in severities" :key="s" :value="i + 1" :severity="s" />
</template>

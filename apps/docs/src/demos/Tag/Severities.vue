<script setup lang="ts">
import { Tag } from '@vitral/vue';

const severities = ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'help', 'contrast'] as const;
</script>

<template>
    <Tag v-for="s in severities" :key="s" :value="s" :severity="s" />
</template>

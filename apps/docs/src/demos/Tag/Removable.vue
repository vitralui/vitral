<script setup lang="ts">
import { Tag } from '@vitral/vue';
import { ref } from 'vue';

const topics = ref(['vue', 'typescript', 'design-tokens', 'accessibility', 'layout']);
</script>

<template>
    <Tag v-for="t in topics" :key="t" :value="t" severity="secondary" rounded removable @remove="topics = topics.filter((x) => x !== t)" />
    <small v-if="!topics.length" style="color: var(--vt-text-muted-color)">All removed.</small>
</template>

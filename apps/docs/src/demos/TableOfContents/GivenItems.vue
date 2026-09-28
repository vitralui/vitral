<script setup lang="ts">
import { TableOfContents } from '@vitral/vue';
import { ref } from 'vue';

const active = ref<string | null>(null);
const items = [
    { id: 'toc-install', label: 'Install' },
    { id: 'toc-npm', label: 'npm, pnpm, yarn', level: 2 },
    { id: 'toc-theme', label: 'Theme' },
    { id: 'toc-use', label: 'Usage' },
    { id: 'toc-ship', label: 'Ship' }
];
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 2rem; align-items: start">
        <TableOfContents v-model:active="active" :items="items" title="Contents" />
        <p>Reading: <strong>{{ active ?? '—' }}</strong></p>
    </div>
</template>

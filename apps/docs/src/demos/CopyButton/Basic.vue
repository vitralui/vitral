<script setup lang="ts">
import { CopyButton } from '@vitral/vue';

const pageLink = () => window.location.href;
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center">
        <code>pnpm add @vitral/vue</code>
        <CopyButton value="pnpm add @vitral/vue" />
        <CopyButton value="pnpm add @vitral/vue" label="Copy command" copied-label="Copied" variant="outlined" />
        <CopyButton :value="pageLink" label="Copy link" severity="primary" variant="filled" rounded />
    </div>
</template>

<script setup lang="ts">
import { Kbd } from '@vitral/vue';
</script>

<template>
    <div style="display: grid; grid-template-columns: auto auto; gap: 0.75rem 1.5rem; align-items: center; justify-content: start">
        <span>macOS</span>
        <Kbd keys="mod+alt+shift+p" platform="mac" />
        <span>Windows and Linux</span>
        <Kbd keys="mod+alt+shift+p" platform="other" />
    </div>
</template>

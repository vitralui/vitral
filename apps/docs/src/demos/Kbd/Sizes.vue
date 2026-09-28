<script setup lang="ts">
import { Kbd } from '@vitral/vue';
</script>

<template>
    <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center">
        <Kbd keys="shift+enter" size="small" />
        <Kbd keys="shift+enter" />
        <Kbd keys="shift+enter" size="large" />
        <Kbd>Esc</Kbd>
        <Kbd :keys="['g', 'i']" separator="then" />
    </div>
</template>

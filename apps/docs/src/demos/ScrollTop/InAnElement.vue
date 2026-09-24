<script setup lang="ts">
import { ScrollTop } from '@vitral/vue';
</script>

<template>
    <div tabindex="0" aria-label="Long text" style="position: relative; height: 14rem; width: 100%; overflow: auto; border: 1px solid var(--vt-content-border-color); border-radius: 8px; padding: 1rem">
        <p v-for="n in 20" :key="n">Line {{ n }}: scroll down and the button appears at the bottom of this box.</p>
        <ScrollTop target="parent" :threshold="100" />
    </div>
</template>

<script setup lang="ts">
import { ScrollPanel } from '@vitral/vue';

const paragraphs = Array.from({ length: 8 }, (_, i) => `Paragraph ${i + 1}. Vitral draws the scrollbars of this panel with the theme's tokens, while the browser keeps doing the scrolling, so the wheel, touch, and the arrow and page keys all work as they do anywhere else.`);
</script>

<template>
    <ScrollPanel aria-label="Notes" style="width: 100%; max-width: 28rem; height: 14rem; border: 1px solid var(--vt-content-border-color); border-radius: 8px">
        <div style="padding: 1rem; width: 40rem">
            <p v-for="p in paragraphs" :key="p" style="margin: 0 0 0.75rem">{{ p }}</p>
        </div>
    </ScrollPanel>
</template>

<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ScrollTop',
    category: 'Misc',
    description:
        'The button back to the top of a long page, or of a scrolling element. It appears past a threshold, is named "Scroll to top", and moves keyboard focus to the start of what it scrolled.'
};
</script>

<script setup lang="ts">
import { ScrollTop } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';
</script>

<template>
    <DemoSection title="In an element">
        <div tabindex="0" aria-label="Long text" style="position: relative; height: 14rem; width: 100%; overflow: auto; border: 1px solid var(--vt-content-border-color); border-radius: 8px; padding: 1rem">
            <p v-for="n in 20" :key="n">Line {{ n }}: scroll down and the button appears at the bottom of this box.</p>
            <ScrollTop target="parent" :threshold="100" />
        </div>
    </DemoSection>
</template>

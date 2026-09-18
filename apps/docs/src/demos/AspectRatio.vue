<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'AspectRatio',
    category: 'Media',
    description: 'A box that keeps its ratio as its width changes, with CSS `aspect-ratio` as a component, with the content cropped to fill it.'
};
</script>

<script setup lang="ts">
import { AspectRatio } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';
</script>

<template>
    <DemoSection title="Ratios">
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: 1rem; width: 100%">
            <figure style="margin: 0">
                <AspectRatio :ratio="16 / 9" style="border-radius: 8px"><img src="https://picsum.photos/id/1018/640/360" alt="Mountains under clouds" /></AspectRatio>
                <figcaption class="demo-hint">16 / 9</figcaption>
            </figure>
            <figure style="margin: 0">
                <AspectRatio :ratio="4 / 3" style="border-radius: 8px"><img src="https://picsum.photos/id/1039/480/360" alt="A waterfall in a forest" /></AspectRatio>
                <figcaption class="demo-hint">4 / 3</figcaption>
            </figure>
            <figure style="margin: 0">
                <AspectRatio style="border-radius: 50%"><img src="https://picsum.photos/id/1027/320/320" alt="A person in a field" /></AspectRatio>
                <figcaption class="demo-hint">1 / 1</figcaption>
            </figure>
        </div>
    </DemoSection>
</template>

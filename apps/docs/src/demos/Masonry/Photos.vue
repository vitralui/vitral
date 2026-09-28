<script setup lang="ts">
import { Masonry } from '@vitral/vue';

// Blocks of colour with the proportions of photographs, drawn inline.
const shapes = [
    [4, 5, '#fca5a5'],
    [4, 3, '#fdba74'],
    [1, 1, '#fcd34d'],
    [3, 4, '#86efac'],
    [16, 9, '#67e8f9'],
    [2, 3, '#93c5fd'],
    [4, 3, '#c4b5fd'],
    [1, 1, '#f9a8d4'],
    [3, 4, '#a5b4fc']
] as const;
const src = (w: number, h: number, fill: string) =>
    'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w * 100} ${h * 100}"><rect width="100%" height="100%" fill="${fill}"/></svg>`);
</script>

<template>
    <Masonry :columns="3" gap="0.5rem">
        <img v-for="([w, h, fill], i) in shapes" :key="i" :src="src(w, h, fill)" :alt="`Photo ${i + 1}`" style="display: block; width: 100%; border-radius: 0.5rem" />
    </Masonry>
</template>

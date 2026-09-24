<script setup lang="ts">
import { AspectRatio } from '@vitral/vue';
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: 1rem; width: 100%">
        <figure style="margin: 0">
            <AspectRatio :ratio="16 / 9" style="border-radius: 8px"><img src="https://picsum.photos/id/1018/640/360" alt="Mountains under clouds" /></AspectRatio>
            <figcaption style="font-size: 0.75rem; color: var(--vt-text-muted-color)">16 / 9</figcaption>
        </figure>
        <figure style="margin: 0">
            <AspectRatio :ratio="4 / 3" style="border-radius: 8px"><img src="https://picsum.photos/id/1039/480/360" alt="A waterfall in a forest" /></AspectRatio>
            <figcaption style="font-size: 0.75rem; color: var(--vt-text-muted-color)">4 / 3</figcaption>
        </figure>
        <figure style="margin: 0">
            <AspectRatio style="border-radius: 50%"><img src="https://picsum.photos/id/1027/320/320" alt="A person in a field" /></AspectRatio>
            <figcaption style="font-size: 0.75rem; color: var(--vt-text-muted-color)">1 / 1</figcaption>
        </figure>
    </div>
</template>

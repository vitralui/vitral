<script setup lang="ts">
import { Carousel } from '@vitral/vue';

const photos = [
    { id: 1015, title: 'River valley' },
    { id: 1016, title: 'Canyon' },
    { id: 1018, title: 'Mountains' },
    { id: 1019, title: 'Coast' },
    { id: 1020, title: 'Bear' },
    { id: 1021, title: 'Fog' },
    { id: 1022, title: 'Aurora' },
    { id: 1024, title: 'Vulture' }
];

const responsive = [
    { breakpoint: '1024px', numVisible: 2, numScroll: 2 },
    { breakpoint: '640px', numVisible: 1, numScroll: 1 }
];
</script>

<template>
    <Carousel :value="photos" :num-visible="3" :num-scroll="3" :responsive-options="responsive" aria-label="Landscapes">
        <template #item="{ data }">
            <figure style="margin: 0 0.5rem">
                <img width="400" height="260" :src="`https://picsum.photos/id/${(data as { id: number }).id}/400/260`" :alt="(data as { title: string }).title" style="display: block; width: 100%; border-radius: 8px; height: auto" />
                <figcaption style="font-size: 0.75rem; color: var(--vt-text-muted-color)">{{ (data as { title: string }).title }}</figcaption>
            </figure>
        </template>
    </Carousel>
</template>

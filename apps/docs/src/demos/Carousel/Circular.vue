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
</script>

<template>
    <Carousel :value="photos" circular :autoplay-interval="3000" aria-label="Featured photo">
        <template #item="{ data }">
            <img width="900" height="360" :src="`https://picsum.photos/id/${(data as { id: number }).id}/900/360`" :alt="(data as { title: string }).title" style="display: block; width: 100%; border-radius: 8px; height: auto" />
        </template>
    </Carousel>
</template>

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
    <Carousel :value="photos" orientation="vertical" :num-visible="2" vertical-view-port-height="22rem" :show-indicators="false" aria-label="Vertical photos" style="max-width: 20rem">
        <template #item="{ data }">
            <img width="320" height="200" :src="`https://picsum.photos/id/${(data as { id: number }).id}/320/200`" :alt="(data as { title: string }).title" style="display: block; width: 100%; height: 100%; object-fit: cover; padding: 0.25rem 0; box-sizing: border-box" />
        </template>
    </Carousel>
</template>

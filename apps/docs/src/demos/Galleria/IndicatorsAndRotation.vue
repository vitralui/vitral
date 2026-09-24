<script setup lang="ts">
import { Galleria } from '@vitral/vue';

const photos = [1011, 1012, 1013, 1014, 1015, 1016, 1018, 1019].map((id, i) => ({ id, alt: `Photograph ${i + 1}` }));
</script>

<template>
    <Galleria :value="photos" :show-thumbnails="false" show-indicators auto-play :transition-interval="3000" aria-label="Photographs, rotating" style="max-width: 32rem">
        <template #item="{ item }">
            <img width="640" height="360" :src="`https://picsum.photos/id/${(item as { id: number }).id}/640/360`" :alt="(item as { alt: string }).alt" style="display: block; width: 100%; height: auto" />
        </template>
    </Galleria>
</template>

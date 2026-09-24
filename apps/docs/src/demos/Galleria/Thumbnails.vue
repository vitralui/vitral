<script setup lang="ts">
import { Galleria } from '@vitral/vue';
import { ref } from 'vue';

const photos = [1011, 1012, 1013, 1014, 1015, 1016, 1018, 1019].map((id, i) => ({ id, alt: `Photograph ${i + 1}` }));
const index = ref(0);
</script>

<template>
    <Galleria v-model:active-index="index" :value="photos" :num-visible="5" show-item-navigators aria-label="Photographs" style="max-width: 40rem">
        <template #item="{ item }">
            <img width="800" height="450" :src="`https://picsum.photos/id/${(item as { id: number }).id}/800/450`" :alt="(item as { alt: string }).alt" style="display: block; width: 100%; height: auto" />
        </template>
        <template #thumbnail="{ item }">
            <img width="120" height="80" :src="`https://picsum.photos/id/${(item as { id: number }).id}/120/80`" alt="" style="display: block; width: 100%; height: auto" />
        </template>
        <template #caption="{ item }">{{ (item as { alt: string }).alt }}</template>
    </Galleria>
</template>

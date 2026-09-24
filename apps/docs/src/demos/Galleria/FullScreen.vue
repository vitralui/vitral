<script setup lang="ts">
import { Button, Galleria } from '@vitral/vue';
import { ref } from 'vue';

const photos = [1011, 1012, 1013, 1014, 1015, 1016, 1018, 1019].map((id, i) => ({ id, alt: `Photograph ${i + 1}` }));
const visible = ref(false);
const index = ref(0);
</script>

<template>
    <Button label="Open gallery" icon="image" @click="visible = true" />
    <Galleria v-model:visible="visible" v-model:active-index="index" :value="photos" full-screen show-item-navigators circular aria-label="Photographs, full screen">
        <template #item="{ item }">
            <img width="1200" height="675" :src="`https://picsum.photos/id/${(item as { id: number }).id}/1200/675`" :alt="(item as { alt: string }).alt" style="display: block; width: 100%; height: auto" />
        </template>
        <template #thumbnail="{ item }">
            <img width="120" height="80" :src="`https://picsum.photos/id/${(item as { id: number }).id}/120/80`" alt="" style="display: block; width: 100%; height: auto" />
        </template>
    </Galleria>
</template>

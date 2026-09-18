<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Galleria',
    category: 'Media',
    description:
        'Images with thumbnails, indicators, rotation and a full-screen mode. The shown image is a named slide; the thumbnails are one tab stop whose arrows move through the images; full screen, the gallery is a modal dialog.'
};
</script>

<script setup lang="ts">
import { Button, Galleria, SelectButton, transitionPresets, type TransitionPreset } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const photos = [1011, 1012, 1013, 1014, 1015, 1016, 1018, 1019].map((id, i) => ({ id, alt: `Photograph ${i + 1}` }));
const index = ref(0);
const preset = ref<TransitionPreset>('fade');
const presetOptions = transitionPresets.map((value) => ({ label: value[0]!.toUpperCase() + value.slice(1), value }));
const shown = ref(0);
const full = ref(false);
const fullIndex = ref(0);
</script>

<template>
    <DemoSection title="Thumbnails">
        <Galleria v-model:active-index="index" :value="photos" :num-visible="5" show-item-navigators aria-label="Photographs" style="max-width: 40rem">
            <template #item="{ item }">
                <img :src="`https://picsum.photos/id/${(item as { id: number }).id}/800/450`" :alt="(item as { alt: string }).alt" style="display: block; width: 100%" />
            </template>
            <template #thumbnail="{ item }">
                <img :src="`https://picsum.photos/id/${(item as { id: number }).id}/120/80`" alt="" style="display: block; width: 100%" />
            </template>
            <template #caption="{ item }">{{ (item as { alt: string }).alt }}</template>
        </Galleria>
    </DemoSection>
    <DemoSection
        title="Transitions"
        description="How one picture gives way to the next, by name. The presets are defined once and shared with Carousel, and every one of them stops under prefers-reduced-motion."
    >
        <div class="demo-stack demo-wide" style="gap: 0.75rem">
            <SelectButton v-model="preset" :options="presetOptions" option-label="label" option-value="value" size="small" :allow-empty="false" aria-label="Transition" />
            <Galleria
                v-model:active-index="shown"
                :value="photos"
                :transition="preset"
                :num-visible="5"
                show-item-navigators
                aria-label="Photographs, with a transition"
                style="max-width: 40rem"
            >
                <template #item="{ item }">
                    <img :src="`https://picsum.photos/id/${(item as { id: number }).id}/800/450`" :alt="(item as { alt: string }).alt" style="display: block; width: 100%" />
                </template>
            </Galleria>
        </div>
    </DemoSection>

    <DemoSection title="Indicators and rotation">
        <Galleria :value="photos" :show-thumbnails="false" show-indicators circular auto-play :transition-interval="3000" aria-label="Photographs, rotating" style="max-width: 32rem">
            <template #item="{ item }">
                <img :src="`https://picsum.photos/id/${(item as { id: number }).id}/640/360`" :alt="(item as { alt: string }).alt" style="display: block; width: 100%" />
            </template>
        </Galleria>
    </DemoSection>
    <DemoSection title="Full screen">
        <Button label="Open gallery" icon="image" @click="full = true" />
        <Galleria v-model:visible="full" v-model:active-index="fullIndex" :value="photos" full-screen show-item-navigators circular aria-label="Photographs, full screen">
            <template #item="{ item }">
                <img :src="`https://picsum.photos/id/${(item as { id: number }).id}/1200/675`" :alt="(item as { alt: string }).alt" style="display: block; width: 100%" />
            </template>
            <template #thumbnail="{ item }">
                <img :src="`https://picsum.photos/id/${(item as { id: number }).id}/120/80`" alt="" style="display: block; width: 100%" />
            </template>
        </Galleria>
    </DemoSection>
</template>

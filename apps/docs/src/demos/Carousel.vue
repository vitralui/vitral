<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Carousel',
    category: 'Media',
    description:
        'A track of items with paging and optional rotation, following the WAI-ARIA carousel: each slide is a named group, slides out of view are hidden, and rotation has a pause button, stops while you point at or work in it, and is not announced while running.'
};
</script>

<script setup lang="ts">
import { Carousel, SelectButton, transitionPresets, type TransitionPreset } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

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
const preset = ref<TransitionPreset>('zoom');
const presetOptions = transitionPresets.filter((p) => p !== 'none').map((value) => ({ label: value[0]!.toUpperCase() + value.slice(1), value }));

const responsive = [
    { breakpoint: '1024px', numVisible: 2, numScroll: 2 },
    { breakpoint: '640px', numVisible: 1, numScroll: 1 }
];
</script>

<template>
    <DemoSection title="Several at once" class="stack">
        <Carousel :value="photos" :num-visible="3" :num-scroll="3" :responsive-options="responsive" aria-label="Landscapes">
            <template #item="{ data }">
                <figure style="margin: 0 0.5rem">
                    <img :src="`https://picsum.photos/id/${(data as { id: number }).id}/400/260`" :alt="(data as { title: string }).title" style="display: block; width: 100%; border-radius: 8px" />
                    <figcaption class="demo-hint">{{ (data as { title: string }).title }}</figcaption>
                </figure>
            </template>
        </Carousel>
    </DemoSection>
    <DemoSection title="Circular, with rotation" class="stack">
        <Carousel :value="photos" circular :autoplay-interval="3000" aria-label="Featured photo">
            <template #item="{ data }">
                <img :src="`https://picsum.photos/id/${(data as { id: number }).id}/900/360`" :alt="(data as { title: string }).title" style="display: block; width: 100%; border-radius: 8px" />
            </template>
        </Carousel>
    </DemoSection>
    <DemoSection title="Vertical">
        <Carousel :value="photos" orientation="vertical" :num-visible="2" vertical-view-port-height="22rem" :show-indicators="false" aria-label="Vertical photos" style="max-width: 20rem">
            <template #item="{ data }">
                <img :src="`https://picsum.photos/id/${(data as { id: number }).id}/320/200`" :alt="(data as { title: string }).title" style="display: block; width: 100%; height: 100%; object-fit: cover; padding: 0.25rem 0; box-sizing: border-box" />
            </template>
        </Carousel>
    </DemoSection>
    <DemoSection
        title="Transitions, one at a time"
        description="The default slides the whole strip, which is what lets a carousel show several at once. Every other preset shows one and animates it where it stands, so it applies only where numVisible is 1. They are the same presets Galleria uses."
    >
        <div class="demo-stack demo-wide" style="gap: 0.75rem">
            <SelectButton v-model="preset" :options="presetOptions" option-label="label" option-value="value" size="small" :allow-empty="false" aria-label="Transition" />
            <Carousel :value="photos" :num-visible="1" :num-scroll="1" :transition="preset" aria-label="Photographs, with a transition">
                <template #item="{ data }">
                    <figure style="margin: 0">
                        <img :src="`https://picsum.photos/id/${(data as { id: number }).id}/800/400`" :alt="(data as { title: string }).title" style="display: block; width: 100%" />
                        <figcaption class="demo-hint">{{ (data as { title: string }).title }}</figcaption>
                    </figure>
                </template>
            </Carousel>
        </div>
    </DemoSection>
</template>

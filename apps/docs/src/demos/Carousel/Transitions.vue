<script setup lang="ts">
import { Carousel, SelectButton, StackPanel, transitionPresets, type TransitionPreset } from '@vitral/vue';
import { ref } from 'vue';

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
</script>

<template>
    <StackPanel spacing="0.75rem" style="flex: 1 1 100%; min-width: 0">
        <SelectButton v-model="preset" :options="presetOptions" option-label="label" option-value="value" size="small" :allow-empty="false" aria-label="Transition" />
        <Carousel :value="photos" :num-visible="1" :num-scroll="1" :transition="preset" aria-label="Photographs, with a transition">
            <template #item="{ data }">
                <figure style="margin: 0">
                    <img width="800" height="400" :src="`https://picsum.photos/id/${(data as { id: number }).id}/800/400`" :alt="(data as { title: string }).title" style="display: block; width: 100%; height: auto" />
                    <figcaption style="font-size: 0.75rem; color: var(--vt-text-muted-color)">{{ (data as { title: string }).title }}</figcaption>
                </figure>
            </template>
        </Carousel>
    </StackPanel>
</template>

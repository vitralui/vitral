<script setup lang="ts">
import { Galleria, SelectButton, StackPanel, transitionPresets, type TransitionPreset } from '@vitral/vue';
import { ref } from 'vue';

const photos = [1011, 1012, 1013, 1014, 1015, 1016, 1018, 1019].map((id, i) => ({ id, alt: `Photograph ${i + 1}` }));
const shown = ref(0);
const preset = ref<TransitionPreset>('fade');
const presetOptions = transitionPresets.map((value) => ({ label: value[0]!.toUpperCase() + value.slice(1), value }));
</script>

<template>
    <StackPanel spacing="0.75rem" style="flex: 1 1 100%; min-width: 0">
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
                <img :src="`https://picsum.photos/id/${(item as { id: number }).id}/800/450`" :alt="(item as { alt: string }).alt" width="800" height="450" style="display: block; width: 100%; height: auto" />
            </template>
            <template #thumbnail="{ item }">
                <img :src="`https://picsum.photos/id/${(item as { id: number }).id}/120/80`" alt="" width="120" height="80" style="display: block; width: 100%; height: auto" />
            </template>
        </Galleria>
    </StackPanel>
</template>

<script setup lang="ts">
import { Button, InputText, Tour, type TourStep } from '@vitral/vue';
import { ref } from 'vue';

const open = ref(false);
const name = ref<{ $el: HTMLElement } | null>(null);
const add = ref<{ $el: HTMLElement } | null>(null);

// The step that asks for a press pulses; the one that only explains does not.
const steps: TourStep[] = [
    { element: () => name.value, popover: { title: 'Name it', description: 'Give the colour a name your team will recognise.' } },
    { element: () => add.value, pulse: true, popover: { title: 'Now add it', description: 'Press New colour to save it to the palette.' } }
];
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%">
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center">
            <InputText ref="name" placeholder="Colour name" aria-label="Colour name" style="flex: 1 1 12rem" />
            <Button ref="add" label="New colour" icon="plus" />
        </div>
        <Button label="Start the tour" icon="play" variant="text" style="align-self: flex-start" @click="open = true" />
        <Tour v-model:open="open" :steps="steps" />
    </div>
</template>

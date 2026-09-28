<script setup lang="ts">
import { Button, SelectButton, Tour, type TourStep } from '@vitral/vue';
import { ref } from 'vue';

const open = ref(false);
const style = ref<'text' | 'dots' | 'bar'>('dots');
const boxes = ref<HTMLElement[]>([]);

const sides = ['top', 'right', 'bottom', 'left'] as const;
const steps: TourStep[] = sides.map((side, i) => ({
    element: () => boxes.value[i],
    popover: { title: `side: '${side}'`, description: `align: 'center'. A press on the dimmed page moves on.`, side, align: 'center' }
}));
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%">
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center">
            <SelectButton v-model="style" :options="['text', 'dots', 'bar']" aria-label="Progress style" :allow-empty="false" />
            <Button label="Start" icon="play" @click="open = true" />
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding: 3rem 0">
            <div v-for="side in sides" :key="side" ref="boxes" style="padding: 1rem; text-align: center; border: 1px dashed var(--vt-content-border-color); border-radius: 0.5rem">{{ side }}</div>
        </div>
        <Tour v-model:open="open" :steps="steps" show-progress :progress-style="style" overlay-click-behavior="nextStep" />
    </div>
</template>

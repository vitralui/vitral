<script setup lang="ts">
import { Button, Checkbox, Slider, Tour, type TourStep } from '@vitral/vue';
import { ref } from 'vue';

const open = ref(false);
const animate = ref(true);
const duration = ref(400);
const arrow = ref(true);
const smooth = ref(true);
const scroll = ref(true);

// `side: 'auto'` takes whichever side has room, and the arrow follows it.
// With `scroll-into-view` off the page stays where it is; the popover stays
// on the screen anyway, beside wherever its element went.
const steps: TourStep[] = [
    { element: '#demo-motion-a', popover: { title: 'Top of the section', description: 'The highlight moves to the next step instead of jumping.', side: 'auto' } },
    { element: '#demo-motion-b', popover: { title: 'Far below', description: 'Reached by scrolling, smoothly when asked.', side: 'auto', align: 'center' } },
    { element: '#demo-motion-a', popover: { title: 'And back', description: 'Placed on whichever side has room.', side: 'auto' } }
];
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%">
        <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center">
            <label style="display: inline-flex; gap: 0.4rem; align-items: center"><Checkbox v-model="animate" binary /> animate</label>
            <label style="display: inline-flex; gap: 0.5rem; align-items: center">duration <Slider v-model="duration" :min="0" :max="1200" :step="100" style="width: 8rem" aria-label="Duration" /> {{ duration }} ms</label>
            <label style="display: inline-flex; gap: 0.4rem; align-items: center"><Checkbox v-model="arrow" binary /> arrow</label>
            <label style="display: inline-flex; gap: 0.4rem; align-items: center"><Checkbox v-model="scroll" binary /> scroll into view</label>
            <label style="display: inline-flex; gap: 0.4rem; align-items: center"><Checkbox v-model="smooth" binary :disabled="!scroll" /> smooth</label>
            <Button label="Start" icon="play" @click="open = true" />
        </div>
        <div id="demo-motion-a" style="padding: 0.75rem; border: 1px dashed var(--vt-content-border-color); border-radius: 0.5rem; align-self: flex-start">First</div>
        <div style="height: 70vh" aria-hidden="true" />
        <div id="demo-motion-b" style="padding: 0.75rem; border: 1px dashed var(--vt-content-border-color); border-radius: 0.5rem; align-self: flex-end">Second</div>
        <Tour
            v-model:open="open"
            :steps="steps"
            :animate="animate"
            :animation-duration="duration"
            :arrow="arrow"
            :scroll-into-view="scroll"
            :smooth-scroll="smooth"
            show-progress
            progress-style="dots"
        />
    </div>
</template>

<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Knob',
    category: 'Form',
    description:
        'A dial for a bounded number. It is a WAI-ARIA slider: arrows step, Page Up/Down step by ten, Home and End go to the ends, and a press or drag anywhere on the dial sets the value under the pointer.'
};
</script>

<script setup lang="ts">
import { Knob } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const volume = ref(60);
const temperature = ref(21);
const balance = ref(0);
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field" style="min-width: 0">
            <span id="knob-volume">Volume</span>
            <Knob v-model="volume" aria-labelledby="knob-volume" value-template="{value}%" />
        </div>
    </DemoSection>
    <DemoSection title="Range, step and size">
        <Knob v-model="temperature" :min="16" :max="30" :step="0.5" :size="140" :stroke-width="10" value-template="{value}°C" aria-label="Temperature" />
        <Knob v-model="balance" :min="-50" :max="50" value-color="var(--vt-help-color)" aria-label="Balance" />
    </DemoSection>
    <DemoSection title="Read-only and disabled">
        <Knob :model-value="75" readonly aria-label="Battery" value-template="{value}%" />
        <Knob :model-value="30" disabled aria-label="Disabled" />
    </DemoSection>
</template>

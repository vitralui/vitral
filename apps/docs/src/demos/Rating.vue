<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Rating',
    category: 'Form',
    description:
        'Stars as a WAI-ARIA radio group with one tab stop: the arrows choose the next or previous star, Home and End the ends. Press the chosen star again, or Delete, to clear it.'
};
</script>

<script setup lang="ts">
import { Rating } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const score = ref<number | null>(3);
const ten = ref<number | null>(7);
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field">
            <span id="rating-label">Your rating</span>
            <Rating v-model="score" aria-labelledby="rating-label" />
            <span class="demo-hint">Value: {{ score ?? 'none' }}</span>
        </div>
    </DemoSection>
    <DemoSection title="More stars, other icons">
        <Rating v-model="ten" :stars="10" on-icon="circle" off-icon="circle" :clearable="false" aria-label="Score out of ten" />
    </DemoSection>
    <DemoSection title="Read-only and disabled">
        <Rating :model-value="4" readonly aria-label="Average rating" />
        <Rating :model-value="2" disabled aria-label="Disabled rating" />
    </DemoSection>
</template>

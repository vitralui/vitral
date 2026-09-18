<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Rating',
    category: 'Form',
    description:
        'Stars as a WAI-ARIA radio group with one tab stop: the arrows choose the next or previous star, Home and End the ends. Press the chosen star again, or Delete, to clear it. With a `step` below one it takes halves and quarters instead, and becomes a slider — half a star is a position on a scale rather than an option in a list — with the star it is halfway through filled halfway.'
};
</script>

<script setup lang="ts">
import { Rating } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const score = ref<number | null>(3);
const ten = ref<number | null>(7);
const half = ref<number | null>(3.5);
const quarter = ref<number | null>(4.25);
const average = 4.3;
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field">
            <span id="rating-label">Your rating</span>
            <Rating v-model="score" aria-labelledby="rating-label" />
            <span class="demo-hint">Value: {{ score ?? 'none' }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Half stars" description="A step of 0.5. Press the left half of a star for the half, the right half for the whole; the arrows move by the step.">
        <div class="demo-field">
            <span id="rating-half">How was it?</span>
            <Rating v-model="half" :step="0.5" aria-labelledby="rating-half" />
            <span class="demo-hint">Value: {{ half ?? 'none' }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Quarters" description="Any step divides the star: the filled one is drawn over the empty one and clipped to the fraction, so there is no half-drawn glyph to keep.">
        <div class="demo-field">
            <span id="rating-quarter">Precision</span>
            <Rating v-model="quarter" :step="0.25" aria-labelledby="rating-quarter" />
            <span class="demo-hint">Value: {{ quarter ?? 'none' }}</span>
        </div>
    </DemoSection>
    <DemoSection title="An average, read-only" description="What a rating is most often for: a number that is not a whole star and was never chosen by this reader.">
        <div class="demo-row">
            <Rating :model-value="average" :step="0.1" readonly aria-label="Average rating" />
            <span class="demo-hint">{{ average }} out of 5, from 1,284 reviews</span>
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

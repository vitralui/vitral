<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Rating',
    category: 'Form',
    description: 'Stars to rate with, in whole steps or in halves and quarters, cleared by choosing the same star again.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Rating/Basic.vue';
import HalfStars from './Rating/HalfStars.vue';
import MoreStars from './Rating/MoreStars.vue';
import Quarters from './Rating/Quarters.vue';
import ReadOnlyAndDisabled from './Rating/ReadOnlyAndDisabled.vue';
import ReadOnlyAverage from './Rating/ReadOnlyAverage.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Half stars" description="A step of 0.5. Press the left half of a star for the half, the right half for the whole; the arrows move by the step."><HalfStars /></DemoSection>
    <DemoSection title="Quarters" description="Any step divides the star: the filled one is drawn over the empty one and clipped to the fraction, so there is no half-drawn glyph to keep."><Quarters /></DemoSection>
    <DemoSection title="An average, read-only" description="What a rating is most often for: a number that is not a whole star and was never chosen by this reader."><ReadOnlyAverage /></DemoSection>
    <DemoSection title="More stars, other icons"><MoreStars /></DemoSection>
    <DemoSection title="Read-only and disabled"><ReadOnlyAndDisabled /></DemoSection>
</template>

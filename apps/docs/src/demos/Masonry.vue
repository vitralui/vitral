<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Masonry',
    category: 'Layout',
    description: 'Items of different heights in columns with no gaps under the short ones, laid out in reading order, so a keyboard and a screen reader go left to right as the eye does.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Cards from './Masonry/Cards.vue';
import Photos from './Masonry/Photos.vue';
</script>

<template>
    <DemoSection title="Cards" description="Each item goes into the column that is shortest so far. Resize the window: there are as many columns as fit `min-column-width`, and an item that grows (open one) moves the ones under it."><Cards /></DemoSection>
    <DemoSection title="A fixed number of columns" description="`columns` fixes the count, and `gap` the space between. Images are measured again as they load."><Photos /></DemoSection>
</template>

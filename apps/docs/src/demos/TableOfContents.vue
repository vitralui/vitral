<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'TableOfContents',
    category: 'Menu',
    description: 'The outline of a page, read from its headings, with the section being read marked as the reader scrolls — the “On this page” beside long documents.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import FromHeadings from './TableOfContents/FromHeadings.vue';
import GivenItems from './TableOfContents/GivenItems.vue';
</script>

<template>
    <DemoSection title="Read from the headings" description="`source` is where to look and `selector` which headings to take; an h3 sits under the h2 before it. Scroll the page: the link of the section at the top of the view is marked, and `offset` is the height of a sticky header that covers it."><FromHeadings /></DemoSection>
    <DemoSection title="An outline of your own" description="`items` gives the outline outright — ids, labels and levels — for headings drawn later or labels shorter than the headings. `v-model:active` is the section being read."><GivenItems /></DemoSection>
</template>

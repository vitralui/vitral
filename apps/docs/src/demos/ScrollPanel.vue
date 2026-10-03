<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ScrollPanel',
    category: 'Panel',
    description: "A scroll container with the theme's own thin bars, over native scrolling — the bars every component that scrolls inside wears, and v-scrollbar puts on a box of your own."
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import BarsShown from './ScrollPanel/BarsShown.vue';
import GrowingContent from './ScrollPanel/GrowingContent.vue';
import OwnBoxes from './ScrollPanel/OwnBoxes.vue';
import VerticalAndHorizontal from './ScrollPanel/VerticalAndHorizontal.vue';
</script>

<template>
    <DemoSection title="Vertical and horizontal"><VerticalAndHorizontal /></DemoSection>
    <DemoSection
        title="When the bars show"
        description="`scrollbar` is `'hover'` by default: the bars show while the pointer is over the panel, focus is inside it, or it scrolls. `'always'` keeps them on the screen, and `'native'` gives the browser's own back. The same prop is on every component that scrolls inside (Sidebar, Select, Dialog, Drawer, DataGrid and the rest), and the application's `scrollbar` option sets it for all of them at once. Only the thumb takes the pointer: a press on the track reaches the content under it."
        ><BarsShown
    /></DemoSection>
    <DemoSection title="Content that grows" description="The bars follow the content as well as the panel: a section opening with an animation, an image loading."><GrowingContent /></DemoSection>
    <DemoSection
        title="Your own boxes"
        description="`v-scrollbar` puts the same bars on a box of your own that already scrolls, without wrapping it: it keeps its place in the layout and its native scrolling. `v-scrollbar.always`, `.hover` and `.native`, or a value, say when they show; with none, the application's `scrollbar` option decides. `.arrows` puts arrows at the ends, as a native bar has — a press scrolls a step, holding it keeps going — and the application's `scrollbarArrows` does the same for every bar."
        ><OwnBoxes
    /></DemoSection>
</template>

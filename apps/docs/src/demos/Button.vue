<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Button',
    category: 'Button',
    description: 'A command in eight severities, four variants and three sizes, with icons, a loading state, a badge, and rendering as a link.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Icons from './Button/Icons.vue';
import IconsFromAnywhere from './Button/IconsFromAnywhere.vue';
import Outlined from './Button/Outlined.vue';
import Severities from './Button/Severities.vue';
import SizesAndShape from './Button/SizesAndShape.vue';
import States from './Button/States.vue';
import TextVariant from './Button/TextVariant.vue';
</script>

<template>
    <DemoSection title="Severities" description="Filled is the default variant. `secondary` is the quiet button of a toolbar; `primary` is the one that commits."><Severities /></DemoSection>
    <DemoSection title="Outlined"><Outlined /></DemoSection>
    <DemoSection title="Text"><TextVariant /></DemoSection>
    <DemoSection title="Icons"><Icons /></DemoSection>
    <DemoSection title="Icons from anywhere" description="An imported icon, another library's component, or trusted SVG markup. An icon font's classes work too: `icon=&quot;fa-solid fa-user&quot;`, once its stylesheet is on the page."><IconsFromAnywhere /></DemoSection>
    <DemoSection title="Sizes and shape"><SizesAndShape /></DemoSection>
    <DemoSection title="States" description="Loading disables the button and sets aria-busy."><States /></DemoSection>
</template>

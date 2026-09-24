<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Cropper',
    category: 'Media',
    description:
        'A crop rectangle over an image, with no dependency: lock a ratio, mask a circle, rotate and flip, and crop on a server or in the browser.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import AvatarCrop from './Cropper/AvatarCrop.vue';
import InDialog from './Cropper/InDialog.vue';
import RatioWithHandles from './Cropper/RatioWithHandles.vue';
import RatiosAndTurns from './Cropper/RatiosAndTurns.vue';
import ShapeOfIt from './Cropper/ShapeOfIt.vue';
import WithoutThirds from './Cropper/WithoutThirds.vue';
</script>

<template>
    <DemoSection title="Avatar" description="A circle locks the ratio to one and drops the handles: drag the crop, or zoom it. The preview beside it is the same picture under a smaller box, not a second render."><AvatarCrop /></DemoSection>
    <DemoSection title="A ratio, with handles" description="Eight handles for the pointer, hidden from assistive technology: the rectangle itself is the one tab stop."><RatioWithHandles /></DemoSection>
    <DemoSection title="Without the thirds" description="The guide is on for a rectangle and off for a circle, where a rule of thirds means nothing. `grid` overrules either way."><WithoutThirds /></DemoSection>
    <DemoSection title="Free, with ratios and turns" description="A chooser locks the ratio; the quarter turns and the flips travel with the crop, so it keeps pointing at the same part of the picture."><RatiosAndTurns /></DemoSection>
    <DemoSection title="In a dialog" description="Where a cropper usually lives: a photograph is chosen, cropped over the page, and the profile changes only once it is accepted. The dialog gives the stage its width, so the crop is measured against what it is actually shown at."><InDialog /></DemoSection>
    <DemoSection title="The shape of it"><ShapeOfIt /></DemoSection>
</template>

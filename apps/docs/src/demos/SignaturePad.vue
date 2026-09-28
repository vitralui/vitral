<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'SignaturePad',
    category: 'Form',
    description: 'A surface to sign on with a mouse, a pen or a finger. The ink follows the speed of the hand, and the signature comes back as an SVG a form can store.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './SignaturePad/Basic.vue';
import InAForm from './SignaturePad/InAForm.vue';
import Ink from './SignaturePad/Ink.vue';
import States from './SignaturePad/States.vue';
</script>

<template>
    <DemoSection title="Basic" description="`v-model` is the signature as an SVG data URL, ready for an `<img>` or a form field; `v-model:strokes` is the points, to draw it again later. Undo takes back the last stroke."><Basic /></DemoSection>
    <DemoSection title="The ink" description="The line follows the hand the way a nib does. `thinning` is how much the pressure changes the width — a pen's own pressure, or else one worked out from the speed, so a slow stroke is wider than a quick one; 0 draws a line of one width. `smoothing` takes the tremor out, `taper` narrows each end to a point over that length, and `pen-width` is the width at middling pressure. The stored SVG is drawn with the same ink. Sign, then move the sliders: the signature is drawn again."><Ink /></DemoSection>
    <DemoSection title="In a form" description="The pad is a field like any other: it takes a label, and `toPNG()` gives an image for a service that wants one."><InAForm /></DemoSection>
    <DemoSection title="Read-only and disabled" description="Read-only shows a signature and takes no more ink; disabled is also dimmed and left out of the tab order."><States /></DemoSection>
</template>

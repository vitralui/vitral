<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'QRCode',
    category: 'Media',
    description: 'A QR code drawn as one SVG path, encoded in the browser with no service and no dependency: sharp at any size, printable, and named for a screen reader.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './QRCode/Basic.vue';
import Colors from './QRCode/Colors.vue';
import WithLogo from './QRCode/WithLogo.vue';
</script>

<template>
    <DemoSection title="Basic" description="Type and the code follows. It picks the smallest version that holds the text, and the densest mode — digits, capitals or bytes — that the text allows."><Basic /></DemoSection>
    <DemoSection title="Size and colour" description="`size` is any CSS length. Keep `color` darker than `background`: most phone cameras will not read a light code on a dark ground."><Colors /></DemoSection>
    <DemoSection title="A logo in the middle" description="With an `image` the code is encoded at level H, which survives losing 30% of it, so the logo hides nothing a reader needs. `imageSize` is its width against the code's."><WithLogo /></DemoSection>
</template>

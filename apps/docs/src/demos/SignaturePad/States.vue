<script setup lang="ts">
import { SignaturePad } from '@vitral/vue';

const strokes: [number, number][][] = [
    [[20, 70], [34, 40], [44, 30], [52, 36], [46, 60], [40, 78], [52, 64], [66, 48], [74, 52], [72, 70], [84, 58], [96, 52], [104, 60], [118, 50], [132, 46], [150, 54]],
    [[160, 40], [172, 76]],
    [[180, 60], [196, 48], [210, 56], [206, 72], [222, 60], [240, 54], [262, 62]]
];
</script>

<template>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 1rem">
        <SignaturePad :strokes="strokes" readonly aria-label="Signed (read-only)" height="7rem" />
        <SignaturePad disabled aria-label="Signature (disabled)" height="7rem" />
    </div>
</template>

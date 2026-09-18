<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Image',
    category: 'Media',
    description:
        'An image, and — with `preview` — a viewer over the page: a modal dialog named by the image, with rotate and zoom buttons (and the + , − and R keys). Escape or a press on the veil closes it, and focus goes back to the image.'
};
</script>

<script setup lang="ts">
import { Image } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';
</script>

<template>
    <DemoSection title="Basic">
        <Image src="https://picsum.photos/id/1043/320/200" alt="A lake between pine-covered hills" width="320" />
    </DemoSection>
    <DemoSection title="Preview">
        <Image src="https://picsum.photos/id/1036/320/200" preview-src="https://picsum.photos/id/1036/1280/800" alt="Snowy mountains at dusk" width="320" preview />
    </DemoSection>
</template>

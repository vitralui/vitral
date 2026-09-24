<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'FloatLabel',
    category: 'Form',
    description:
        'A real label that starts inside the field and lifts out on focus or once there is a value; IftaLabel keeps it inside, above the value.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import BasicIftaLabel from './FloatLabel/BasicIftaLabel.vue';
import Variants from './FloatLabel/Variants.vue';
import WithSelect from './FloatLabel/WithSelect.vue';
</script>

<template>
    <DemoSection title="Variants" description="over (the default), in and on."><Variants /></DemoSection>
    <DemoSection title="With a select" description="A select has no placeholder state to read, so `filled` tells the wrapper."><WithSelect /></DemoSection>
    <DemoSection title="IftaLabel"><BasicIftaLabel /></DemoSection>
</template>

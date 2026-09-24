<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'InputOtp',
    category: 'Form',
    description: 'One box per character of a one-time code, that moves along as you type and fills at once from a paste or autofill.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './InputOtp/Basic.vue';
import Masked from './InputOtp/Masked.vue';
import SizesAndStates from './InputOtp/SizesAndStates.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Masked"><Masked /></DemoSection>
    <DemoSection title="Sizes and states"><SizesAndStates /></DemoSection>
</template>

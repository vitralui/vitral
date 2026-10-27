<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'InputColor',
    category: 'Form',
    description: 'A text box for a colour: the swatch opens the picker, the hex is typed, and empty is null.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './InputColor/Basic.vue';
import Swatches from './InputColor/Swatches.vue';
import SizesAndStates from './InputColor/SizesAndStates.vue';
</script>

<template>
    <DemoSection title="Basic" description="Six digits take as they are typed; a short #rgb when the box is left. ArrowDown opens the picker, Escape comes back to the box."><Basic /></DemoSection>
    <DemoSection title="Swatches" description="A palette under the picker, for the colours a value usually comes from."><Swatches /></DemoSection>
    <DemoSection title="Sizes and states"><SizesAndStates /></DemoSection>
</template>

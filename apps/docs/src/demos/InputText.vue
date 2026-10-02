<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'InputText',
    category: 'Form',
    description: 'A single-line text box whose attributes land on the native input, with prefix and suffix content, a clear button and an optional mask.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import AdornmentsAndClear from './InputText/AdornmentsAndClear.vue';
import Basic from './InputText/Basic.vue';
import Fluid from './InputText/Fluid.vue';
import Masks from './InputText/Masks.vue';
import SizesVariantsStates from './InputText/SizesVariantsStates.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Adornments and clear button" description="Content inside the field on either side, and the clear button."><AdornmentsAndClear /></DemoSection>
    <DemoSection title="Masks" description="`mask` types into a pattern, as InputMask does, keeping the adornments and the clear button. It takes a pattern, a list, a function, or a mask object."><Masks /></DemoSection>
    <DemoSection title="Sizes, variants and states"><SizesVariantsStates /></DemoSection>
    <DemoSection title="Fluid" class="stack"><Fluid /></DemoSection>
</template>

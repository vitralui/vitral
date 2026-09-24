<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Textarea',
    category: 'Form',
    description: 'A multi-line text box on the same field chrome as InputText, that can grow with its content.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import AutoResize from './Textarea/AutoResize.vue';
import Basic from './Textarea/Basic.vue';
import Fluid from './Textarea/Fluid.vue';
import SizesVariantsAndStates from './Textarea/SizesVariantsAndStates.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Auto resize" description="No scrollbar and no handle: the height follows the text."><AutoResize /></DemoSection>
    <DemoSection title="Sizes, variants and states"><SizesVariantsAndStates /></DemoSection>
    <DemoSection title="Fluid" class="stack"><Fluid /></DemoSection>
</template>

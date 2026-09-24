<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'InputNumber',
    category: 'Form',
    description: 'A number box with steppers, clamped to a range and formatted in the locale, as a decimal, a currency or a percentage.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './InputNumber/Basic.vue';
import Formats from './InputNumber/Formats.vue';
import SizesVariantsStates from './InputNumber/SizesVariantsStates.vue';
import SpinButtons from './InputNumber/SpinButtons.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Formats" description="Currency, percent, a suffix and a fixed number of digits, each read back correctly when typed."><Formats /></DemoSection>
    <DemoSection title="Spin buttons" description="Stacked puts up over down at the end of the field; horizontal puts minus and plus either side. Hold a button to keep stepping."><SpinButtons /></DemoSection>
    <DemoSection title="Sizes, variants and states"><SizesVariantsStates /></DemoSection>
</template>

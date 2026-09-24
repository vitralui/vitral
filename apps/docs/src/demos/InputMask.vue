<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'InputMask',
    category: 'Form',
    description: 'A text box that types into a pattern, such as a phone or a date, filling in the literals for you.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './InputMask/Basic.vue';
import SizesAndStates from './InputMask/SizesAndStates.vue';
import SlotAndOptional from './InputMask/SlotAndOptional.vue';
import UnmaskedValue from './InputMask/UnmaskedValue.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Unmasked value"><UnmaskedValue /></DemoSection>
    <DemoSection title="Slot characters and optional parts"><SlotAndOptional /></DemoSection>
    <DemoSection title="Sizes and states"><SizesAndStates /></DemoSection>
</template>

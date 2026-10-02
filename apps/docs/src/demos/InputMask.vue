<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'InputMask',
    category: 'Form',
    description: 'A text box that types into a pattern, such as a phone or a date, filling in the literals for you. InputText and AutoComplete take the same masks.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './InputMask/Basic.vue';
import ChangingPattern from './InputMask/ChangingPattern.vue';
import SizesAndStates from './InputMask/SizesAndStates.vue';
import SlotAndOptional from './InputMask/SlotAndOptional.vue';
import SharedMasks from './InputMask/SharedMasks.vue';
import UnmaskedValue from './InputMask/UnmaskedValue.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Unmasked value"><UnmaskedValue /></DemoSection>
    <DemoSection
        title="A pattern that follows the value"
        description="A list shows the first pattern with room for what has been typed: the CPF turns into a CNPJ at the twelfth digit, and back when one is deleted. A function receives the characters typed so far and returns the pattern."
        ><ChangingPattern
    /></DemoSection>
    <DemoSection title="Masks as values" description="A mask object carries the pattern with its settings, so it is defined once and gives the same box in InputMask, InputText and AutoComplete. A setting on the field wins over the one in the object."><SharedMasks /></DemoSection>
    <DemoSection title="Slot characters and optional parts"><SlotAndOptional /></DemoSection>
    <DemoSection title="Sizes and states"><SizesAndStates /></DemoSection>
</template>

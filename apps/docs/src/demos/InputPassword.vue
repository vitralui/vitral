<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'InputPassword',
    category: 'Form',
    description: 'A password box with a reveal button and a strength meter.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import RevealAndClear from './InputPassword/RevealAndClear.vue';
import RulesInFooter from './InputPassword/RulesInFooter.vue';
import SizesAndStates from './InputPassword/SizesAndStates.vue';
import StrengthMeter from './InputPassword/StrengthMeter.vue';
</script>

<template>
    <DemoSection title="Strength meter"><StrengthMeter /></DemoSection>
    <DemoSection title="Reveal and clear"><RevealAndClear /></DemoSection>
    <DemoSection title="Rules in the footer"><RulesInFooter /></DemoSection>
    <DemoSection title="Sizes and states"><SizesAndStates /></DemoSection>
</template>

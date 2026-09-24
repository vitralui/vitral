<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'InputGroup',
    category: 'Form',
    description: 'Fields, buttons and addons welded into one control, with inner corners squared and a single border between neighbours.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Addons from './InputGroup/Addons.vue';
import NamedRange from './InputGroup/NamedRange.vue';
import WithButton from './InputGroup/WithButton.vue';
</script>

<template>
    <DemoSection title="Addons"><Addons /></DemoSection>
    <DemoSection title="With a button"><WithButton /></DemoSection>
    <DemoSection title="A named range" description="Two controls, one name: the group is announced as “Price range”."><NamedRange /></DemoSection>
</template>

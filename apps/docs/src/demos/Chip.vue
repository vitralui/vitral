<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Chip',
    category: 'Misc',
    description: 'A compact token for a filter, a recipient or a tag, with an optional image, icon and remove button.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Chip/Basic.vue';
import IconAndImage from './Chip/IconAndImage.vue';
import Removable from './Chip/Removable.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Icon and image"><IconAndImage /></DemoSection>
    <DemoSection title="Removable" description="Tab to a remove button and press Delete."><Removable /></DemoSection>
</template>

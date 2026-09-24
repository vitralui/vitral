<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Inplace',
    category: 'Misc',
    description: 'A display that turns into its editor when activated, and back again when done.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Disabled from './Inplace/Disabled.vue';
import EditableText from './Inplace/EditableText.vue';
import LazyContent from './Inplace/LazyContent.vue';
</script>

<template>
    <DemoSection title="Editable text"><EditableText /></DemoSection>
    <DemoSection title="Lazy content"><LazyContent /></DemoSection>
    <DemoSection title="Disabled"><Disabled /></DemoSection>
</template>

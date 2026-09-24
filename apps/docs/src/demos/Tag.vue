<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Tag',
    category: 'Misc',
    description: 'A short label for a status or a category, in every severity, with an optional remove button.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import IconsAndShape from './Tag/IconsAndShape.vue';
import Removable from './Tag/Removable.vue';
import Severities from './Tag/Severities.vue';
</script>

<template>
    <DemoSection title="Severities"><Severities /></DemoSection>
    <DemoSection title="Icons and shape"><IconsAndShape /></DemoSection>
    <DemoSection title="Removable" description="Tab to a remove button and press Delete."><Removable /></DemoSection>
</template>

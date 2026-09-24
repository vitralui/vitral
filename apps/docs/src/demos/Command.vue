<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Command',
    category: 'Menu',
    description: 'A search box over a list of commands that filters as you type, inline or as a modal palette opened with a hotkey.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Inline from './Command/Inline.vue';
import Palette from './Command/Palette.vue';
</script>

<template>
    <DemoSection title="Inline" class="stack"><Inline /></DemoSection>
    <DemoSection title="Palette"><Palette /></DemoSection>
</template>

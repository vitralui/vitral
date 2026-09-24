<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Menu',
    category: 'Menu',
    description: 'A list of commands and links, inline or as a popup, with groups and separators.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import InlineWithGroups from './Menu/InlineWithGroups.vue';
import PopupMenu from './Menu/PopupMenu.vue';
</script>

<template>
    <DemoSection title="Inline, with groups" class="stack"><InlineWithGroups /></DemoSection>
    <DemoSection title="Popup"><PopupMenu /></DemoSection>
</template>

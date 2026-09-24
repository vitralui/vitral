<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'TieredMenu',
    category: 'Menu',
    description: 'A menu whose items open submenus beside them, to any depth, inline or as a popup.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import InlineMenu from './TieredMenu/InlineMenu.vue';
import PopupMenu from './TieredMenu/PopupMenu.vue';
</script>

<template>
    <DemoSection title="Inline" class="stack"><InlineMenu /></DemoSection>
    <DemoSection title="Popup"><PopupMenu /></DemoSection>
</template>

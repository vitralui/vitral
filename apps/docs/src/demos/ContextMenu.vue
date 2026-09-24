<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ContextMenu',
    category: 'Menu',
    description: 'The menu a right-click or the context-menu key opens, at the pointer or under the focused element, with submenus.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import OnAnElement from './ContextMenu/OnAnElement.vue';
</script>

<template>
    <DemoSection title="On an element" class="stack"><OnAnElement /></DemoSection>
</template>

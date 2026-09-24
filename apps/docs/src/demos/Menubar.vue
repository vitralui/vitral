<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Menubar',
    category: 'Menu',
    description: 'The application menu bar, with nested menus, that becomes a single menu button on narrow screens.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Menubar/Basic.vue';
import SmallScreens from './Menubar/SmallScreens.vue';
</script>

<template>
    <DemoSection title="Basic" class="stack"><Basic /></DemoSection>
    <DemoSection title="Small screens" class="stack"><SmallScreens /></DemoSection>
</template>

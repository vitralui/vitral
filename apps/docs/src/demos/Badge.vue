<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Badge',
    category: 'Misc',
    description: 'A count or a status dot, on its own or pinned to the corner of what it wraps with OverlayBadge.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Overlay from './Badge/Overlay.vue';
import Severities from './Badge/Severities.vue';
import SizesAndDot from './Badge/SizesAndDot.vue';
</script>

<template>
    <DemoSection title="Severities"><Severities /></DemoSection>
    <DemoSection title="Sizes and dot" description="Without a value the badge is a dot."><SizesAndDot /></DemoSection>
    <DemoSection title="OverlayBadge" description="Bind the slot’s `badgeId` as aria-describedby: “Notifications, 4”."><Overlay /></DemoSection>
</template>

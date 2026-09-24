<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Avatar',
    category: 'Media',
    description: 'A face, initials or an icon in a fixed box, in three sizes and with an optional badge; AvatarGroup overlaps a row of them.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Group from './Avatar/Group.vue';
import LabelIconAndImage from './Avatar/LabelIconAndImage.vue';
import Sizes from './Avatar/Sizes.vue';
import WithBadge from './Avatar/WithBadge.vue';
</script>

<template>
    <DemoSection title="Label, icon and image"><LabelIconAndImage /></DemoSection>
    <DemoSection title="Sizes"><Sizes /></DemoSection>
    <DemoSection title="Group" description="The group is a list named “Reviewers”; the last avatar counts the rest."><Group /></DemoSection>
    <DemoSection title="With a badge"><WithBadge /></DemoSection>
</template>

<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Avatar',
    category: 'Media',
    description:
        'A face, initials or an icon in a fixed box. The image is decorative by default, because a name usually sits beside it; give it `alt` when it stands alone. `AvatarGroup` overlaps a row of them and names the row.'
};
</script>

<script setup lang="ts">
import { Avatar, AvatarGroup, OverlayBadge } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';

const people = ['AL', 'GH', 'KJ', 'MR'];
</script>

<template>
    <DemoSection title="Label, icon and image">
        <Avatar label="AL" />
        <Avatar label="GH" shape="circle" />
        <Avatar icon="user" />
        <Avatar icon="user" shape="circle" />
        <Avatar image="https://i.pravatar.cc/96?img=12" alt="Ada Lovelace" shape="circle" />
    </DemoSection>
    <DemoSection title="Sizes">
        <Avatar label="S" />
        <Avatar label="L" size="large" />
        <Avatar label="XL" size="xlarge" />
        <Avatar icon="user" size="xlarge" shape="circle" />
    </DemoSection>
    <DemoSection title="Group" description="The group is a list named “Reviewers”; the last avatar counts the rest.">
        <AvatarGroup label="Reviewers">
            <Avatar v-for="p in people" :key="p" :label="p" shape="circle" />
            <Avatar label="+5" shape="circle" />
        </AvatarGroup>
    </DemoSection>
    <DemoSection title="With a badge">
        <OverlayBadge value="3" severity="danger">
            <Avatar icon="user" size="large" />
        </OverlayBadge>
        <OverlayBadge severity="success">
            <Avatar label="GH" size="large" shape="circle" />
        </OverlayBadge>
    </DemoSection>
</template>

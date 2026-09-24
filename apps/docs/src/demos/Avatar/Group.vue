<script setup lang="ts">
import { Avatar, AvatarGroup } from '@vitral/vue';

const people = ['AL', 'GH', 'KJ', 'MR'];
</script>

<template>
    <AvatarGroup label="Reviewers">
        <Avatar v-for="p in people" :key="p" :label="p" shape="circle" />
        <Avatar label="+5" shape="circle" />
    </AvatarGroup>
</template>

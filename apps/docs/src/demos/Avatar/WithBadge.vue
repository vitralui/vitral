<script setup lang="ts">
import { Avatar, OverlayBadge } from '@vitral/vue';
</script>

<template>
    <OverlayBadge value="3" severity="danger">
        <Avatar icon="user" size="large" />
    </OverlayBadge>
    <OverlayBadge severity="success">
        <Avatar label="GH" size="large" shape="circle" />
    </OverlayBadge>
</template>

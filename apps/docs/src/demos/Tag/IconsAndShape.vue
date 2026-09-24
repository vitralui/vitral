<script setup lang="ts">
import { Tag } from '@vitral/vue';
</script>

<template>
    <Tag value="New" icon="star" />
    <Tag value="Verified" icon="check" severity="success" rounded />
    <Tag value="Due today" icon="clock" severity="warn" rounded />
    <Tag value="Blocked" icon="error" severity="danger" />
</template>

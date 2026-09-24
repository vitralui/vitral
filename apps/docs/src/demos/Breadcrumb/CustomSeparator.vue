<script setup lang="ts">
import { Breadcrumb, type BreadcrumbItem } from '@vitral/vue';

const folders: BreadcrumbItem[] = [
    { label: 'Documents', icon: 'folder', url: '#' },
    { label: 'Projects', icon: 'folder', url: '#' },
    { label: 'README.md', icon: 'file' }
];
</script>

<template>
    <Breadcrumb :model="folders">
        <template #separator>/</template>
    </Breadcrumb>
</template>

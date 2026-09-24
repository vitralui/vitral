<script setup lang="ts">
import { Dock, type MenuItem } from '@vitral/vue';

const apps: MenuItem[] = [
    { label: 'Files', icon: 'folder' },
    { label: 'Calendar', icon: 'calendar' },
    { label: 'Notifications', icon: 'bell' },
    { label: 'Settings', icon: 'sliders' },
    { label: 'Downloads', icon: 'download' },
    { label: 'Trash', icon: 'trash' }
];
</script>

<template>
    <Dock :model="apps" position="left" aria-label="Apps (vertical)" />
</template>

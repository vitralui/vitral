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
    <!-- A desktop, with the dock against its left edge. -->
    <div style="display: flex; align-items: center; width: 100%; height: 26rem; border-radius: 8px; background: linear-gradient(135deg, var(--vt-primary-100), var(--vt-primary-300))">
        <Dock :model="apps" position="left" aria-label="Apps (vertical)" />
    </div>
</template>

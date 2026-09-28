<script setup lang="ts">
import { Dock, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';

const last = ref('—');
const run = ({ item }: { item: MenuItem }) => (last.value = item.label ?? '');
const apps: MenuItem[] = [
    { label: 'Files', icon: 'folder', command: run },
    { label: 'Calendar', icon: 'calendar', command: run },
    { label: 'Notifications', icon: 'bell', command: run },
    { label: 'Settings', icon: 'sliders', command: run },
    { label: 'Downloads', icon: 'download', command: run },
    { label: 'Trash', icon: 'trash', command: run }
];
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%">
        <!-- A desktop, with the dock resting on its bottom edge. -->
        <div style="display: flex; align-items: flex-end; justify-content: center; width: 100%; height: 12rem; border-radius: 8px; background: linear-gradient(135deg, var(--vt-primary-100), var(--vt-primary-300))">
            <Dock :model="apps" aria-label="Apps" />
        </div>
        <small style="color: var(--vt-text-muted-color)">Last opened: {{ last }}</small>
    </div>
</template>

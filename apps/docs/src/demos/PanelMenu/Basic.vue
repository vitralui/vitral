<script setup lang="ts">
import { PanelMenu, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';

const last = ref('—');
const run = ({ item }: { item: MenuItem }) => (last.value = item.label ?? '');
const items: MenuItem[] = [
    {
        label: 'Files',
        icon: 'folder',
        items: [
            { label: 'Documents', icon: 'folderOpen', items: [{ label: 'Invoices', icon: 'file', command: run }, { label: 'Contracts', icon: 'file', command: run }] },
            { label: 'Images', icon: 'folderOpen', command: run },
            { label: 'Shared', icon: 'externalLink', url: '#' }
        ]
    },
    { label: 'Cloud', icon: 'upload', items: [{ label: 'Upload', icon: 'upload', command: run }, { label: 'Download', icon: 'download', command: run }, { label: 'Sync', icon: 'refresh', command: run }] },
    { label: 'Account', icon: 'user', items: [{ label: 'Settings', icon: 'sliders', command: run }, { label: 'Privacy', command: run, disabled: true }] },
    { label: 'Sign out', icon: 'arrowRight', command: run }
];
const expanded = ref<Record<string, boolean>>({ '0': true });
</script>

<template>
    <PanelMenu v-model:expanded-keys="expanded" :model="items" />
    <small style="color: var(--vt-text-muted-color)">Last command: {{ last }}</small>
</template>

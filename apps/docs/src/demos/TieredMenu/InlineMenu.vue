<script setup lang="ts">
import { TieredMenu, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';

const last = ref('—');
const run = ({ item }: { item: MenuItem }) => (last.value = item.label ?? '');

const items: MenuItem[] = [
    {
        label: 'File',
        icon: 'file',
        items: [
            { label: 'New', icon: 'plus', items: [{ label: 'Document', command: run }, { label: 'Spreadsheet', command: run }, { label: 'Presentation', command: run }] },
            { label: 'Open', icon: 'folderOpen', command: run },
            { separator: true },
            { label: 'Export', icon: 'download', items: [{ label: 'PDF', command: run }, { label: 'CSV', command: run }] }
        ]
    },
    {
        label: 'Edit',
        icon: 'pencil',
        items: [
            { label: 'Copy', icon: 'copy', command: run },
            { label: 'Delete', icon: 'trash', command: run, disabled: true }
        ]
    },
    { label: 'Search', icon: 'search', command: run },
    { separator: true },
    { label: 'Help', icon: 'externalLink', url: '#' }
];
</script>

<template>
    <TieredMenu :model="items" aria-label="Workspace" />
    <small style="color: var(--vt-text-muted-color)">Last command: {{ last }}</small>
</template>

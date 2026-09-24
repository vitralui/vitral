<script setup lang="ts">
import { Button, TieredMenu, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';

const items: MenuItem[] = [
    {
        label: 'File',
        icon: 'file',
        items: [
            { label: 'New', icon: 'plus', items: [{ label: 'Document' }, { label: 'Spreadsheet' }, { label: 'Presentation' }] },
            { label: 'Open', icon: 'folderOpen' },
            { separator: true },
            { label: 'Export', icon: 'download', items: [{ label: 'PDF' }, { label: 'CSV' }] }
        ]
    },
    {
        label: 'Edit',
        icon: 'pencil',
        items: [
            { label: 'Copy', icon: 'copy' },
            { label: 'Delete', icon: 'trash', disabled: true }
        ]
    },
    { label: 'Search', icon: 'search' },
    { separator: true },
    { label: 'Help', icon: 'externalLink', url: '#' }
];

const popup = ref<InstanceType<typeof TieredMenu> | null>(null);
</script>

<template>
    <Button label="Workspace" icon="menu" severity="secondary" aria-haspopup="menu" @click="popup?.toggle($event)" />
    <TieredMenu ref="popup" :model="items" popup />
</template>

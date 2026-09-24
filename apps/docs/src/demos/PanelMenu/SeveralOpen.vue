<script setup lang="ts">
import { PanelMenu, type MenuItem } from '@vitral/vue';

const items: MenuItem[] = [
    {
        label: 'Files',
        icon: 'folder',
        items: [
            { label: 'Documents', icon: 'folderOpen', items: [{ label: 'Invoices', icon: 'file' }, { label: 'Contracts', icon: 'file' }] },
            { label: 'Images', icon: 'folderOpen' },
            { label: 'Shared', icon: 'externalLink', url: '#' }
        ]
    },
    { label: 'Cloud', icon: 'upload', items: [{ label: 'Upload', icon: 'upload' }, { label: 'Download', icon: 'download' }, { label: 'Sync', icon: 'refresh' }] },
    { label: 'Account', icon: 'user', items: [{ label: 'Settings', icon: 'sliders' }, { label: 'Privacy', disabled: true }] },
    { label: 'Sign out', icon: 'arrowRight' }
];
</script>

<template>
    <PanelMenu :model="items" multiple />
</template>

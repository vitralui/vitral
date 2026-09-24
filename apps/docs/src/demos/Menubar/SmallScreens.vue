<script setup lang="ts">
import { Menubar, type MenuItem } from '@vitral/vue';

const items: MenuItem[] = [
    { label: 'Home', icon: 'home' },
    {
        label: 'Projects',
        icon: 'folder',
        items: [
            { label: 'Vitral', icon: 'star' },
            { label: 'Archive', icon: 'folderOpen', items: [{ label: '2025' }, { label: '2024' }] },
            { separator: true },
            { label: 'New project', icon: 'plus' }
        ]
    },
    {
        label: 'Team',
        icon: 'user',
        items: [{ label: 'Members' }, { label: 'Invitations', disabled: true }]
    },
    { label: 'Docs', icon: 'externalLink', url: '#' }
];
</script>

<template>
    <Menubar :model="items" aria-label="Application (compact)" breakpoint="100000px" />
    <small style="color: var(--vt-text-muted-color)">A breakpoint wider than any screen keeps this one in its small-screen form.</small>
</template>

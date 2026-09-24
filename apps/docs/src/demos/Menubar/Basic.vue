<script setup lang="ts">
import { Avatar, InputText, Menubar, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';

const last = ref('—');
const run = ({ item }: { item: MenuItem }) => (last.value = item.label ?? '');
const items: MenuItem[] = [
    { label: 'Home', icon: 'home', command: run },
    {
        label: 'Projects',
        icon: 'folder',
        items: [
            { label: 'Vitral', icon: 'star', command: run },
            { label: 'Archive', icon: 'folderOpen', items: [{ label: '2025', command: run }, { label: '2024', command: run }] },
            { separator: true },
            { label: 'New project', icon: 'plus', command: run }
        ]
    },
    {
        label: 'Team',
        icon: 'user',
        items: [
            { label: 'Members', command: run },
            { label: 'Invitations', command: run, disabled: true }
        ]
    },
    { label: 'Docs', icon: 'externalLink', url: '#' }
];
</script>

<template>
    <Menubar :model="items" aria-label="Application">
        <template #start><strong style="padding-inline: 0.5rem">Vitral</strong></template>
        <template #end>
            <div style="display: flex; align-items: center; gap: 0.5rem">
                <InputText size="small" placeholder="Search" aria-label="Search" />
                <Avatar label="GW" shape="circle" />
            </div>
        </template>
    </Menubar>
    <small style="color: var(--vt-text-muted-color)">Last command: {{ last }}</small>
</template>

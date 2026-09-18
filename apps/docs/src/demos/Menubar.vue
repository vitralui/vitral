<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Menubar',
    category: 'Menu',
    description:
        'The application menu bar, with the WAI-ARIA menubar keyboard: Left and Right move along the bar, Down and Up open a menu, Right and Left inside move to the neighbouring menu, Escape closes a level. Below `breakpoint` it becomes a menu button that lists the items in a column.'
};
</script>

<script setup lang="ts">
import { href } from '../lib/router';
import { Avatar, InputText, Menubar, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

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
    { label: 'Docs', icon: 'externalLink', url: href('/components/menubar') }
];
</script>

<template>
    <DemoSection title="Basic" class="stack">
        <Menubar :model="items" aria-label="Application">
            <template #start><strong style="padding-inline: 0.5rem">Vitral</strong></template>
            <template #end>
                <div style="display: flex; align-items: center; gap: 0.5rem">
                    <InputText size="small" placeholder="Search" aria-label="Search" />
                    <Avatar label="GW" shape="circle" />
                </div>
            </template>
        </Menubar>
        <span class="demo-hint">Last command: {{ last }}</span>
    </DemoSection>
    <DemoSection title="Small screens" class="stack">
        <Menubar :model="items" aria-label="Application (compact)" breakpoint="100000px" />
        <span class="demo-hint">A breakpoint wider than any screen keeps this one in its small-screen form.</span>
    </DemoSection>
</template>

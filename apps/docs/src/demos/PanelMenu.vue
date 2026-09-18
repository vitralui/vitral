<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'PanelMenu',
    category: 'Menu',
    description:
        'Sections of navigation that expand in place, for a sidebar. Headers are buttons (Up/Down move between them); each open section is a WAI-ARIA tree of its items — arrows walk and open branches, Enter runs an item.'
};
</script>

<script setup lang="ts">
import { PanelMenu, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const last = ref('—');
const run = ({ item }: { item: MenuItem }) => (last.value = item.label ?? '');
const items: MenuItem[] = [
    {
        label: 'Files',
        icon: 'folder',
        items: [
            { label: 'Documents', icon: 'folderOpen', items: [{ label: 'Invoices', icon: 'file', command: run }, { label: 'Contracts', icon: 'file', command: run }] },
            { label: 'Images', icon: 'folderOpen', command: run },
            { label: 'Shared', icon: 'externalLink', url: '#/components/panelmenu' }
        ]
    },
    { label: 'Cloud', icon: 'upload', items: [{ label: 'Upload', icon: 'upload', command: run }, { label: 'Download', icon: 'download', command: run }, { label: 'Sync', icon: 'refresh', command: run }] },
    { label: 'Account', icon: 'user', items: [{ label: 'Settings', icon: 'sliders', command: run }, { label: 'Privacy', command: run, disabled: true }] },
    { label: 'Sign out', icon: 'arrowRight', command: run }
];
const expanded = ref<Record<string, boolean>>({ '0': true });
</script>

<template>
    <DemoSection title="Basic">
        <PanelMenu v-model:expanded-keys="expanded" :model="items" />
        <span class="demo-hint">Last command: {{ last }}</span>
    </DemoSection>
    <DemoSection title="Several open">
        <PanelMenu :model="items" multiple />
    </DemoSection>
</template>

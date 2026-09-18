<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'TieredMenu',
    category: 'Menu',
    description:
        'A menu whose items open submenus beside them, to any depth — inline or as a popup. It is the WAI-ARIA menu: Up and Down move (wrapping), Right or Enter opens a submenu on its first item, Left or Escape goes back, typeahead jumps within a level.'
};
</script>

<script setup lang="ts">
import { Button, TieredMenu, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

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
    { label: 'Help', icon: 'externalLink', url: '#/components/tieredmenu' }
];

const popup = ref<InstanceType<typeof TieredMenu> | null>(null);
</script>

<template>
    <DemoSection title="Inline" class="stack">
        <TieredMenu :model="items" aria-label="Workspace" />
        <span class="demo-hint">Last command: {{ last }}</span>
    </DemoSection>
    <DemoSection title="Popup">
        <Button label="Workspace" icon="menu" severity="secondary" aria-haspopup="menu" @click="popup?.toggle($event)" />
        <TieredMenu ref="popup" :model="items" popup />
    </DemoSection>
</template>

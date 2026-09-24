<script setup lang="ts">
import { MegaMenu, type MegaMenuItem, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';

const last = ref('—');
const run = ({ item }: { item: MenuItem }) => (last.value = item.label ?? '');
const items: MegaMenuItem[] = [
    {
        label: 'Components',
        icon: 'grip',
        items: [
            [{ label: 'Form', items: [{ label: 'InputText', command: run }, { label: 'Select', command: run }, { label: 'DatePicker', command: run }] }],
            [
                { label: 'Data', items: [{ label: 'DataGrid', command: run }, { label: 'Tree', command: run }] },
                { label: 'Overlay', items: [{ label: 'Dialog', command: run }, { label: 'Popover', command: run }] }
            ],
            [{ label: 'Menu', items: [{ label: 'Menubar', command: run }, { label: 'MegaMenu', command: run }, { label: 'Dock', command: run, disabled: true }] }]
        ]
    },
    {
        label: 'Guides',
        icon: 'file',
        items: [[{ label: 'Start', items: [{ label: 'Installation', command: run }, { label: 'Theming', command: run }] }]]
    },
    { label: 'GitHub', icon: 'externalLink', url: '#' }
];
</script>

<template>
    <MegaMenu :model="items" aria-label="Site" />
    <small style="color: var(--vt-text-muted-color)">Last link: {{ last }}</small>
</template>

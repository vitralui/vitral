<script setup lang="ts">
import { MegaMenu, type MegaMenuItem } from '@vitral/vue';

const items: MegaMenuItem[] = [
    {
        label: 'Components',
        icon: 'grip',
        items: [
            [{ label: 'Form', items: [{ label: 'InputText' }, { label: 'Select' }, { label: 'DatePicker' }] }],
            [
                { label: 'Data', items: [{ label: 'DataGrid' }, { label: 'Tree' }] },
                { label: 'Overlay', items: [{ label: 'Dialog' }, { label: 'Popover' }] }
            ],
            [{ label: 'Menu', items: [{ label: 'Menubar' }, { label: 'MegaMenu' }, { label: 'Dock', disabled: true }] }]
        ]
    },
    {
        label: 'Guides',
        icon: 'file',
        items: [[{ label: 'Start', items: [{ label: 'Installation' }, { label: 'Theming' }] }]]
    },
    { label: 'GitHub', icon: 'externalLink', url: '#' }
];
</script>

<template>
    <MegaMenu :model="items" orientation="vertical" aria-label="Site (vertical)" />
</template>

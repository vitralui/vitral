<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'MegaMenu',
    category: 'Menu',
    description:
        'A menubar whose items open wide panels of grouped links, in columns — the kind this site’s own top bar uses. Up and Down walk every link of a panel in reading order, Left and Right move to the neighbouring panel, Escape closes it.'
};
</script>

<script setup lang="ts">
import { MegaMenu, type MegaMenuItem, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const last = ref('—');
const run = ({ item }: { item: MenuItem }) => (last.value = item.label ?? '');
const items: MegaMenuItem[] = [
    {
        label: 'Components',
        icon: 'grip',
        items: [
            [{ label: 'Form', items: [{ label: 'InputText', command: run }, { label: 'Select', command: run }, { label: 'DatePicker', command: run }] }],
            [
                { label: 'Data', items: [{ label: 'DataTable', command: run }, { label: 'Tree', command: run }] },
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
    { label: 'GitHub', icon: 'externalLink', url: '#/components/megamenu' }
];
</script>

<template>
    <DemoSection title="Horizontal" class="stack">
        <MegaMenu :model="items" aria-label="Site" />
        <span class="demo-hint">Last link: {{ last }}</span>
    </DemoSection>
    <DemoSection title="Vertical">
        <MegaMenu :model="items" orientation="vertical" aria-label="Site (vertical)" />
    </DemoSection>
</template>

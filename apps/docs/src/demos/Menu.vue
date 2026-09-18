<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Menu',
    category: 'Menu',
    description:
        'A list of commands and links, inline or as a popup. It is the WAI-ARIA menu: arrows (wrapping), Home/End, typeahead, Enter/Space; groups are labelled, separators announced. A popup opens with focus on its first item and gives focus back to its trigger on Escape, Tab or a choice.'
};
</script>

<script setup lang="ts">
import { Button, Menu, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const last = ref('—');
const run = ({ item }: { item: MenuItem }) => (last.value = item.label ?? '');

const grouped: MenuItem[] = [
    {
        label: 'Documents',
        items: [
            { label: 'New', icon: 'plus', command: run },
            { label: 'Search', icon: 'search', command: run }
        ]
    },
    {
        label: 'Profile',
        items: [
            { label: 'Settings', icon: 'sliders', command: run },
            { label: 'Notifications', icon: 'bell', command: run, disabled: true },
            { label: 'Help', icon: 'externalLink', url: '#' }
        ]
    }
];

const actions: MenuItem[] = [
    { label: 'Rename', icon: 'pencil', command: run },
    { label: 'Copy', icon: 'copy', command: run },
    { label: 'Download', icon: 'download', command: run },
    { separator: true },
    { label: 'Delete', icon: 'trash', command: run }
];

const popup = ref<InstanceType<typeof Menu> | null>(null);
const open = ref(false);
</script>

<template>
    <DemoSection title="Inline, with groups" class="stack">
        <Menu :model="grouped" aria-label="Account" />
        <span class="demo-hint">Last command: {{ last }}</span>
    </DemoSection>
    <DemoSection title="Popup">
        <Button
            label="Actions"
            icon="moreVertical"
            severity="secondary"
            aria-haspopup="menu"
            :aria-expanded="open"
            :aria-controls="open ? 'demo-actions-menu' : undefined"
            @click="popup?.toggle($event)"
        />
        <Menu id="demo-actions-menu" ref="popup" :model="actions" popup @show="open = true" @hide="open = false" />
    </DemoSection>
</template>

<script setup lang="ts">
import { Menu, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';

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
</script>

<template>
    <Menu :model="grouped" aria-label="Account" />
    <small style="color: var(--vt-text-muted-color)">Last command: {{ last }}</small>
</template>

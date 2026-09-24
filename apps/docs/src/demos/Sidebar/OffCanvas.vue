<script setup lang="ts">
import { Button, Sidebar, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';

const active = ref('home');
const go = (key: string) => () => (active.value = key);
const items: MenuItem[] = [
    { label: 'Home', key: 'home', icon: 'home', command: go('home') },
    { label: 'Inbox', key: 'inbox', icon: 'bell', command: go('inbox') },
    {
        label: 'Workspace',
        items: [
            { label: 'Projects', key: 'projects', icon: 'folder', items: [{ label: 'Vitral', key: 'vitral', command: go('vitral') }, { label: 'Website', key: 'site', command: go('site') }] },
            { label: 'Calendar', key: 'calendar', icon: 'calendar', command: go('calendar') },
            { label: 'Reports', key: 'reports', icon: 'file', command: go('reports') }
        ]
    },
    { label: 'Settings', items: [{ label: 'Preferences', key: 'prefs', icon: 'sliders', command: go('prefs') }] }
];

const hidden = ref(false);
</script>

<template>
    <div style="display: flex; height: 18rem; width: 100%; border: 1px solid var(--vt-content-border-color); border-radius: 8px; overflow: hidden">
        <Sidebar v-model:collapsed="hidden" :model="items" :active-key="active" collapsible="offcanvas" aria-label="Main navigation" />
        <div style="flex: 1; padding: 1rem">
            <Button :label="hidden ? 'Show sidebar' : 'Hide sidebar'" icon="sidebar" severity="secondary" :aria-expanded="!hidden" @click="hidden = !hidden" />
        </div>
    </div>
</template>

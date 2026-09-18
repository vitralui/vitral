<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Sidebar',
    category: 'Menu',
    description:
        'The collapsible application sidebar: a named navigation of links and buttons, the current page marked, sub-lists that open in place. It collapses to its icons (labels stay for screen readers and show as tooltips) and becomes a drawer on small screens.'
};
</script>

<script setup lang="ts">
import { Avatar, Button, Sidebar, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

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

const collapsed = ref(false);
const hidden = ref(false);
</script>

<template>
    <DemoSection title="Collapsible to icons">
        <div style="display: flex; height: 26rem; width: 100%; border: 1px solid var(--vt-content-border-color); border-radius: 8px; overflow: hidden">
            <Sidebar v-model:collapsed="collapsed" :model="items" :active-key="active">
                <template #header="{ collapsed: small }">
                    <strong>{{ small ? 'A' : 'Acme Inc.' }}</strong>
                </template>
                <template #footer>
                    <div style="display: flex; align-items: center; gap: 0.5rem">
                        <Avatar label="GW" shape="circle" />
                        <span>Gustavo</span>
                    </div>
                </template>
            </Sidebar>
            <main style="flex: 1; padding: 1rem">Page: {{ active }}</main>
        </div>
    </DemoSection>
    <DemoSection title="Off canvas">
        <div style="display: flex; height: 18rem; width: 100%; border: 1px solid var(--vt-content-border-color); border-radius: 8px; overflow: hidden">
            <Sidebar v-model:collapsed="hidden" :model="items" :active-key="active" collapsible="offcanvas" aria-label="Main navigation" />
            <div style="flex: 1; padding: 1rem">
                <Button :label="hidden ? 'Show sidebar' : 'Hide sidebar'" icon="sidebar" severity="secondary" :aria-expanded="!hidden" @click="hidden = !hidden" />
            </div>
        </div>
    </DemoSection>
</template>

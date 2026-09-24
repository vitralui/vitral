<script setup lang="ts">
import { Avatar, Sidebar, type MenuItem } from '@vitral/vue';
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

const collapsed = ref(false);
</script>

<template>
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
</template>

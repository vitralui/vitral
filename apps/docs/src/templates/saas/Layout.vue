<script setup lang="ts">
import { layoutDashboard, settings, sparkles, users } from '@vitral/icons';
import { Button, Icon, InputText, Select } from '@vitral/vue';
import { ref } from 'vue';
import AppShell from '../kit/AppShell.vue';
import { provideTemplate } from '../kit/context';
import { screens } from './screens';

const props = defineProps<{ standalone?: boolean }>();
const screen = defineModel<string>('screen', { default: 'overview' });
const { current } = provideTemplate(screen, screens, () => props.standalone);

const icons = { overview: layoutDashboard, customers: users, settings };
// An admin for more than one product has to say which one it is showing.
const workspaces = [
    { label: 'Lumen Metrics', value: 'metrics' },
    { label: 'Lumen Inbox', value: 'inbox' },
    { label: 'Acme (sandbox)', value: 'sandbox' }
];
const workspace = ref('metrics');
</script>

<template>
    <AppShell
        brand="Lumen Metrics"
        :brand-icon="sparkles"
        :icons="icons"
        variant="inset"
        :groups="[{ label: 'Account', screens: ['settings'] }]"
        :user="{ name: 'Priya Raman', role: 'Head of Growth', initials: 'PR' }"
    >
        <template #aside="{ collapsed }">
            <div v-if="!collapsed" class="tp-aside">
                <Select v-model="workspace" :options="workspaces" option-label="label" option-value="value" size="small" aria-label="Workspace" fluid />
            </div>
        </template>
        <template #asideFooter="{ collapsed }">
            <div v-if="!collapsed" class="tp-aside-note">
                Events this month
                <b>3.4M</b>
                of 5M on Scale
            </div>
        </template>
        <template #actions="{ narrow }">
            <InputText v-if="!narrow" placeholder="Search…" aria-label="Search Lumen Metrics" size="small">
                <template #prefix><Icon icon="search" /></template>
            </InputText>
            <Button v-else icon="search" variant="text" severity="secondary" aria-label="Search" />
        </template>
        <component :is="current.component" />
    </AppShell>
</template>

<script setup lang="ts">
import { bell, creditCard, flask, inbox, layoutDashboard, logOut, settings, sparkles, userCircle, users } from '@vitral/icons';
import { Button, Icon, InputText, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';
import AppShell from '../kit/AppShell.vue';
import { provideTemplate } from '../kit/context';
import { screens } from './screens';

const props = defineProps<{ standalone?: boolean }>();
const screen = defineModel<string>('screen', { default: 'overview' });
const { current, go } = provideTemplate(screen, screens, () => props.standalone);

const icons = { overview: layoutDashboard, customers: users, settings };
// An admin for more than one product has to say which one it is showing, so the
// brand is the switcher: the product you are in, its plan, and the way out.
const workspaces = [
    { label: 'Lumen Metrics', value: 'metrics', hint: 'Scale · 5 seats', icon: sparkles },
    { label: 'Lumen Inbox', value: 'inbox', hint: 'Growth · 2 seats', icon: inbox },
    { label: 'Acme (sandbox)', value: 'sandbox', hint: 'Free', icon: flask }
];
const workspace = ref('metrics');
// The signed-in line at the foot opens the account, the way a console's does.
const account: MenuItem[] = [
    { label: 'Account', icon: userCircle, command: () => go('settings') },
    { label: 'Billing', icon: creditCard, command: () => go('settings') },
    { label: 'Notifications', icon: bell, command: () => go('settings') },
    { separator: true },
    { label: 'Sign out', icon: logOut }
];
</script>

<template>
    <AppShell
        brand="Lumen Metrics"
        :brand-icon="sparkles"
        :icons="icons"
        variant="inset"
        :switcher="workspaces"
        v-model:workspace="workspace"
        :groups="[{ label: 'Account', screens: ['settings'] }]"
        :user="{ name: 'Priya Raman', role: 'Head of Growth', initials: 'PR', menu: account }"
    >
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

<script setup lang="ts">
import { layoutDashboard, settings, sparkles, users } from '@vitral/icons';
import { Button, Icon, InputText } from '@vitral/vue';
import AppShell from '../kit/AppShell.vue';
import { provideTemplate } from '../kit/context';
import { screens } from './screens';

const props = defineProps<{ standalone?: boolean }>();
const screen = defineModel<string>('screen', { default: 'overview' });
const { current } = provideTemplate(screen, screens, () => props.standalone);

const icons = { overview: layoutDashboard, customers: users, settings };
</script>

<template>
    <AppShell brand="Lumen Metrics" :brand-icon="sparkles" :icons="icons" :user="{ name: 'Priya Raman', role: 'Head of Growth', initials: 'PR' }">
        <template #actions="{ narrow }">
            <InputText v-if="!narrow" placeholder="Search…" aria-label="Search Lumen Metrics" size="small">
                <template #prefix><Icon icon="search" /></template>
            </InputText>
            <Button v-else icon="search" variant="text" severity="secondary" aria-label="Search" />
        </template>
        <component :is="current.component" />
    </AppShell>
</template>

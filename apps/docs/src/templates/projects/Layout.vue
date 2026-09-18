<script setup lang="ts">
import { calendarRange, kanban, rocket, users } from '@vitral/icons';
import { Avatar, AvatarGroup, Button, Icon } from '@vitral/vue';
import AppShell from '../kit/AppShell.vue';
import { provideTemplate } from '../kit/context';
import { photo } from '../kit/format';
import { team } from './data';
import { screens } from './screens';

const props = defineProps<{ standalone?: boolean }>();
const screen = defineModel<string>('screen', { default: 'board' });
const { current } = provideTemplate(screen, screens, () => props.standalone);

const icons = { board: kanban, timeline: calendarRange, team: users };
const pictured = team.filter((member) => member.photo).slice(0, 3);
</script>

<template>
    <AppShell
        brand="Orbit"
        :brand-icon="rocket"
        :icons="icons"
        variant="inset"
        :groups="[{ label: 'People', screens: ['team'] }]"
        :user="{ name: 'Ana Ferraz', role: 'Product lead', initials: 'AF' }"
    >
        <!-- A tool people live in all day opens a palette rather than a field:
             the shortcut is the point, and the button is there to teach it. -->
        <template #aside="{ collapsed }">
            <div v-if="!collapsed" class="tp-aside tp-aside-search">
                <Button severity="secondary" variant="outlined" size="small" fluid aria-label="Search, or jump to anything">
                    <Icon icon="search" />
                    <span>Jump to…</span>
                    <kbd>⌘K</kbd>
                </Button>
            </div>
        </template>
        <template #asideFooter="{ collapsed }">
            <div v-if="!collapsed" class="tp-aside-note">
                On this project
                <AvatarGroup label="Project members">
                    <Avatar v-for="member in pictured" :key="member.id" :image="photo(member.photo!, 80, 80)" :alt="member.name" shape="circle" />
                    <Avatar :label="`+${team.length - pictured.length}`" shape="circle" />
                </AvatarGroup>
            </div>
        </template>
        <component :is="current.component" />
    </AppShell>
</template>

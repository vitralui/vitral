<script setup lang="ts">
import { calendarRange, kanban, rocket, users } from '@vitral/icons';
import { Avatar, AvatarGroup, Button, Icon, type MenuItem } from '@vitral/vue';
import { computed } from 'vue';
import AppShell from '../kit/AppShell.vue';
import { provideTemplate } from '../kit/context';
import { photo } from '../kit/format';
import { team, view } from './data';
import { screens } from './screens';

const props = defineProps<{ standalone?: boolean }>();
const screen = defineModel<string>('screen', { default: 'board' });
const { current, go } = provideTemplate(screen, screens, () => props.standalone);

const icons = { board: kanban, timeline: calendarRange, team: users };
const pictured = team.filter((member) => member.photo).slice(0, 3);

// The board is not one place but three, so its item in the sidebar opens a
// sub-list of them rather than the screen. The board's own buttons set the same
// view, and whichever one is showing is the item marked current.
const views: { label: string; value: string }[] = [
    { label: 'All tasks', value: 'All' },
    { label: 'High priority', value: 'High priority' },
    { label: 'Mine', value: 'Mine' }
];
const submenus = computed<Record<string, MenuItem[]>>(() => ({
    board: views.map((entry) => ({
        label: entry.label,
        key: `board-${entry.value}`,
        active: screen.value === 'board' && view.value === entry.value,
        command: () => {
            view.value = entry.value;
            go('board');
        }
    }))
}));
</script>

<template>
    <AppShell
        brand="Orbit"
        :brand-icon="rocket"
        :icons="icons"
        variant="floating"
        :groups="[
            { label: 'Orbit 2.0', screens: ['board', 'timeline'] },
            { label: 'People', screens: ['team'] }
        ]"
        :submenus="submenus"
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

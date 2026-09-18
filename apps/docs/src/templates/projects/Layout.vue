<script setup lang="ts">
import { calendarRange, kanban, rocket, users } from '@vitral/icons';
import { Avatar, AvatarGroup } from '@vitral/vue';
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
    <AppShell brand="Orbit" :brand-icon="rocket" :icons="icons" :user="{ name: 'Ana Ferraz', role: 'Product lead', initials: 'AF' }">
        <template #actions="{ narrow }">
            <AvatarGroup v-if="!narrow" label="Project members">
                <Avatar v-for="member in pictured" :key="member.id" :image="photo(member.photo!, 80, 80)" :alt="member.name" shape="circle" />
                <Avatar :label="`+${team.length - pictured.length}`" shape="circle" />
            </AvatarGroup>
        </template>
        <component :is="current.component" />
    </AppShell>
</template>

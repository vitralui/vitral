<script setup lang="ts">
import { award, bookOpen, calendarDays, graduationCap, playCircle } from '@vitral/icons';
import AppShell from '../kit/AppShell.vue';
import { provideTemplate } from '../kit/context';
import { screens } from './screens';

const props = defineProps<{ standalone?: boolean }>();
const screen = defineModel<string>('screen', { default: 'courses' });
const { current } = provideTemplate(screen, screens, () => props.standalone);

const icons = { courses: bookOpen, lesson: playCircle, calendar: calendarDays, grades: award };
</script>

<template>
    <AppShell brand="Brightpath" :brand-icon="graduationCap" :icons="icons" :user="{ name: 'Sofia Brandão', role: 'Student · Year 2', initials: 'SB' }">
        <component :is="current.component" />
    </AppShell>
</template>

<script setup lang="ts">
import { award, bookOpen, calendarDays, graduationCap, playCircle } from '@vitral/icons';
import { ProgressBar, ToggleSwitch } from '@vitral/vue';
import { ref, useId } from 'vue';
import AppShell from '../kit/AppShell.vue';
import { provideTemplate } from '../kit/context';
import { screens } from './screens';

const props = defineProps<{ standalone?: boolean }>();
const screen = defineModel<string>('screen', { default: 'courses' });
const { current } = provideTemplate(screen, screens, () => props.standalone);

const icons = { courses: bookOpen, lesson: playCircle, calendar: calendarDays, grades: award };
// A student's sidebar answers one question before any other: how far along am I.
const focus = ref(false);
const focusId = useId();
</script>

<template>
    <AppShell
        brand="Brightpath"
        :brand-icon="graduationCap"
        :icons="icons"
        :groups="[{ label: 'This term', screens: ['calendar', 'grades'] }]"
        :user="{ name: 'Sofia Brandão', role: 'Student · Year 2', initials: 'SB' }"
    >
        <template #asideFooter="{ collapsed }">
            <template v-if="!collapsed">
                <div class="tp-aside-meter">
                    <div class="tp-aside-meter-head">
                        <span>Year 2</span>
                        <span>68%</span>
                    </div>
                    <ProgressBar :value="68" :show-value="false" aria-label="Progress through year 2" />
                </div>
                <div class="tp-aside-switch">
                    <label :for="focusId">Focus mode</label>
                    <ToggleSwitch :input-id="focusId" v-model="focus" />
                </div>
            </template>
        </template>
        <component :is="current.component" />
    </AppShell>
</template>

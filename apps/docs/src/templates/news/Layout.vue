<script setup lang="ts">
import { bookOpen } from '@vitral/icons';
import { Button } from '@vitral/vue';
import { computed } from 'vue';
import { provideTemplate } from '../kit/context';
import StoreShell from '../kit/StoreShell.vue';
import { paper, sections } from './data';
import { screens } from './screens';

// A paper says which day it is; it is the one thing a masthead always carries.
const edition = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const props = defineProps<{ standalone?: boolean }>();
const screen = defineModel<string>('screen', { default: 'front' });
const { current, go } = provideTemplate(screen, screens, () => props.standalone);

// Every section link opens the one section screen, showing that section.
const links = computed(() => [
    { id: 'front', label: 'Today' },
    ...sections.map((entry) => ({
        id: entry.id,
        label: entry.name,
        current: screen.value === 'section' && paper.section === entry.id,
        select: () => {
            paper.section = entry.id;
            go('section');
        }
    }))
]);
</script>

<template>
    <StoreShell
        brand="The Lantern"
        :brand-icon="bookOpen"
        :links="links"
        layout="centre"
        tagline="Independent news, every morning since 1921 (in a world that does not exist)."
    >
        <template #subnav>
            <span>{{ edition }}</span>
            <span>Today's paper</span>
            <span>Weather 14°C</span>
        </template>
        <template #actions="{ narrow }">
            <Button v-if="!narrow" label="Subscribe" size="small" />
            <Button icon="search" variant="text" severity="secondary" aria-label="Search the paper" />
        </template>
        <component :is="current.component" />
        <template #footer>
            <ul class="tp-footer-links" aria-label="About the paper">
                <li>Corrections</li>
                <li>Newsletters</li>
                <li>Careers</li>
            </ul>
        </template>
    </StoreShell>
</template>

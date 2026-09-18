<script setup lang="ts">
import { pencilLine, rss } from '@vitral/icons';
import { Button } from '@vitral/vue';
import { provideTemplate } from '../kit/context';
import StoreShell from '../kit/StoreShell.vue';
import { screens } from './screens';

const props = defineProps<{ standalone?: boolean }>();
const screen = defineModel<string>('screen', { default: 'posts' });
const { current } = provideTemplate(screen, screens, () => props.standalone);

const links = [
    { id: 'posts', label: 'Writing' },
    { id: 'about', label: 'About' }
];
</script>

<template>
    <StoreShell brand="Field Notes" :brand-icon="pencilLine" :links="links" tagline="Notes on design, photography and making things slowly. By Noor Aziz.">
        <template #actions>
            <Button :icon="rss" variant="text" severity="secondary" aria-label="RSS feed" />
        </template>
        <component :is="current.component" />
    </StoreShell>
</template>

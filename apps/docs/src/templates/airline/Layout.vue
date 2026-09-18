<script setup lang="ts">
import { plane, userCircle } from '@vitral/icons';
import { Button, Tag } from '@vitral/vue';
import { provideTemplate } from '../kit/context';
import StoreShell from '../kit/StoreShell.vue';
import { screens } from './screens';

const props = defineProps<{ standalone?: boolean }>();
const screen = defineModel<string>('screen', { default: 'search' });
const { current } = provideTemplate(screen, screens, () => props.standalone);

const links = [
    { id: 'search', label: 'Book' },
    { id: 'results', label: 'Flights' },
    { id: 'summary', label: 'My trip' }
];
</script>

<template>
    <StoreShell
        brand="Skylark Air"
        :brand-icon="plane"
        :links="links"
        announcement="Bags included on every fare until 30 November"
        tagline="Short hops and long hauls between cities that exist only here."
    >
        <template #actions="{ narrow }">
            <Tag v-if="!narrow" value="Skylark Club · 12,480 pts" severity="secondary" />
            <Button :icon="userCircle" :label="narrow ? undefined : 'Sign in'" :aria-label="narrow ? 'Sign in' : undefined" variant="text" severity="secondary" size="small" />
        </template>
        <component :is="current.component" />
    </StoreShell>
</template>

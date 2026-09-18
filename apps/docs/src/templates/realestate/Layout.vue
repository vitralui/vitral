<script setup lang="ts">
import { heart, keyHouse } from '@vitral/icons';
import { Button } from '@vitral/vue';
import { provideTemplate } from '../kit/context';
import StoreShell from '../kit/StoreShell.vue';
import { screens } from './screens';

const props = defineProps<{ standalone?: boolean }>();
const screen = defineModel<string>('screen', { default: 'search' });
const { current } = provideTemplate(screen, screens, () => props.standalone);

const links = [
    { id: 'search', label: 'Buy' },
    { id: 'listings', label: 'Listings' },
    { id: 'property', label: 'Featured home' }
];
</script>

<template>
    <StoreShell brand="Northgate Homes" :brand-icon="keyHouse" :links="links" tagline="Homes in the harbour, the hills and the woods. Licensed agents since 1987.">
        <template #actions="{ narrow }">
            <Button :icon="heart" variant="text" severity="secondary" aria-label="Saved homes" />
            <Button v-if="!narrow" label="Sell with us" severity="secondary" variant="outlined" size="small" />
        </template>
        <component :is="current.component" />
    </StoreShell>
</template>

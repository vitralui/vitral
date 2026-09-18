<script setup lang="ts">
import { heart, keyHouse } from '@vitral/icons';
import { Button, Icon, InputText, OverlayBadge } from '@vitral/vue';
import { ref } from 'vue';
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

// On a property site the place you are looking in belongs in the bar: it is the
// question every screen is an answer to.
const where = ref('');
const saved = 4;
</script>

<template>
    <StoreShell brand="Northgate Homes" :brand-icon="keyHouse" :links="links" tagline="Homes in the harbour, the hills and the woods. Licensed agents since 1987.">
        <template #actions="{ narrow }">
            <InputText v-if="!narrow" v-model="where" placeholder="Harbour, hills, a postcode…" aria-label="Where are you looking" size="small">
                <template #prefix><Icon icon="search" /></template>
            </InputText>
            <OverlayBadge :value="saved" size="small">
                <Button :icon="heart" variant="text" severity="secondary" :aria-label="`Saved homes, ${saved}`" />
            </OverlayBadge>
            <Button v-if="!narrow" label="Sell with us" severity="secondary" variant="outlined" size="small" />
        </template>
        <component :is="current.component" />
    </StoreShell>
</template>

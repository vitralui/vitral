<script setup lang="ts">
import { shoppingCart, storefront } from '@vitral/icons';
import { Button, Icon, InputText, OverlayBadge } from '@vitral/vue';
import { ref } from 'vue';
import { provideTemplate } from '../kit/context';
import StoreShell from '../kit/StoreShell.vue';
import { cartCount } from './data';
import { screens } from './screens';

const props = defineProps<{ standalone?: boolean }>();
const screen = defineModel<string>('screen', { default: 'home' });
const { current, go } = provideTemplate(screen, screens, () => props.standalone);

const links = [
    { id: 'home', label: 'Shop' },
    { id: 'product', label: 'Featured' },
    { id: 'cart', label: 'Cart' }
];

// A shop is browsed by department, which is a row of its own: putting eight
// categories in the bar beside the brand would leave no room for the search.
const departments = ['Kitchen', 'Table', 'Cleaning', 'Storage', 'Garden', 'Workshop', 'Gifts'];
const query = ref('');
</script>

<template>
    <StoreShell
        brand="Fernhill Supply"
        :brand-icon="storefront"
        :links="links"
        announcement="Free shipping over $150 · Returns within 60 days"
        tagline="Slow, well-made everyday things. Free shipping over $150."
    >
        <template #subnav>
            <button v-for="department in departments" :key="department" type="button" @click="go('home')">{{ department }}</button>
        </template>
        <template #actions="{ narrow }">
            <InputText v-if="!narrow" v-model="query" placeholder="Search the shop" aria-label="Search the shop" size="small">
                <template #prefix><Icon icon="search" /></template>
            </InputText>
            <OverlayBadge :value="cartCount" size="small">
                <Button :icon="shoppingCart" variant="text" severity="secondary" :aria-label="`Cart, ${cartCount} items`" @click="go('cart')" />
            </OverlayBadge>
        </template>
        <component :is="current.component" />
        <template #footer>
            <ul class="tp-footer-links" aria-label="Help">
                <li>Shipping &amp; returns</li>
                <li>Care guides</li>
                <li>Contact</li>
            </ul>
        </template>
    </StoreShell>
</template>

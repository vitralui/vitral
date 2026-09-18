<script setup lang="ts">
import { shoppingCart, storefront } from '@vitral/icons';
import { Button, OverlayBadge } from '@vitral/vue';
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
</script>

<template>
    <StoreShell brand="Fernhill Supply" :brand-icon="storefront" :links="links" tagline="Slow, well-made everyday things. Free shipping over $150.">
        <template #actions>
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

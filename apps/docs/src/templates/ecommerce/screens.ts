import { defineAsyncComponent } from 'vue';
import type { TemplateScreen } from '../types';

export const screens: TemplateScreen[] = [
    { id: 'home', name: 'Store', summary: 'Hero, categories and a sortable product grid', component: defineAsyncComponent(() => import('./Home.vue')) },
    { id: 'product', name: 'Product', summary: 'Gallery, variants, quantity and reviews', component: defineAsyncComponent(() => import('./Product.vue')) },
    { id: 'cart', name: 'Cart', summary: 'Line items, a coupon and the order total', component: defineAsyncComponent(() => import('./Cart.vue')) },
    { id: 'checkout', name: 'Checkout', summary: 'Shipping, payment and review in three steps', component: defineAsyncComponent(() => import('./Checkout.vue')) }
];

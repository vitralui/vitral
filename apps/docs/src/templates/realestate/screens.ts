import { defineAsyncComponent } from 'vue';
import type { TemplateScreen } from '../types';

export const screens: TemplateScreen[] = [
    { id: 'search', name: 'Search', summary: 'A search panel over a drawn map with pins and featured homes', component: defineAsyncComponent(() => import('./Search.vue')) },
    { id: 'listings', name: 'Listings', summary: 'Filters, sorting and a grid or list of homes', component: defineAsyncComponent(() => import('./Listings.vue')) },
    { id: 'property', name: 'Property', summary: 'Gallery, facts, a mortgage estimate and booking a visit', component: defineAsyncComponent(() => import('./Property.vue')) }
];

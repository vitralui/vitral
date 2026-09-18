import { defineAsyncComponent } from 'vue';
import type { TemplateScreen } from '../types';

export const screens: TemplateScreen[] = [
    { id: 'overview', name: 'Overview', summary: 'KPIs, revenue and sign-up charts, plan mix and activity', component: defineAsyncComponent(() => import('./Overview.vue')) },
    { id: 'customers', name: 'Customers', summary: 'A searchable, filterable, paginated customer table', component: defineAsyncComponent(() => import('./Customers.vue')) },
    { id: 'settings', name: 'Settings', summary: 'Profile, notifications and billing in tabs', component: defineAsyncComponent(() => import('./Settings.vue')) }
];

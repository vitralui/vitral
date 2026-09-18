import { defineAsyncComponent } from 'vue';
import type { TemplateScreen } from '../types';

export const screens: TemplateScreen[] = [
    { id: 'accounts', name: 'Accounts', summary: 'Balances, net worth, cash flow, budgets and recent activity', component: defineAsyncComponent(() => import('./Accounts.vue')) },
    { id: 'transactions', name: 'Transactions', summary: 'A filterable, sortable table of every payment', component: defineAsyncComponent(() => import('./Transactions.vue')) },
    { id: 'transfer', name: 'Transfer', summary: 'A three-step transfer with a one-time code', component: defineAsyncComponent(() => import('./Transfer.vue')) }
];

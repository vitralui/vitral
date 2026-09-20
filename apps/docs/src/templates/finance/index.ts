import { defineAsyncComponent } from 'vue';
import { bank } from '@vitral/icons';
import type { TemplateMeta } from '../types';
import { screens } from './screens';

export const template: TemplateMeta = {
    id: 'finance',
    name: 'Harborline Bank',
    category: 'Dashboard',
    icon: bank,
    summary: 'Online banking: account balances with charts, a transactions table and a transfer flow.',
    description:
        'A personal banking app. The overview shows every account, net worth and cash flow, budgets and the latest payments; transactions filter by payee, category, account and date; a transfer goes through details, review and a one-time code, and lands in the table.',
    tags: ['Banking', 'Charts', 'Forms'],
    features: [
        'Account cards with a one-click “hide balances” for screen sharing',
        'Net worth and cash-flow charts, and budgets that turn red when exceeded',
        'A transaction table filtered by payee, categories, account and date',
        'A linear transfer: payee list, currency input, schedule, review, one-time code',
        'The transfer updates the balance and appears as a pending transaction',
        'One header across the top: the collapse button, a breadcrumb, and the sidebar under it'
    ],
    faq: [
        {
            question: 'Are amounts formatted for other currencies?',
            answer: 'InputNumber and the formatters take a currency and a locale; change USD and en-US in data.ts and the transfer step.'
        },
        {
            question: 'How do the filters interact with the table?',
            answer: 'They compute the rows handed to DataTable, which keeps sorting and paging on top. For large data, move the same filters to your API and use lazy mode.'
        },
        { question: 'Is the one-time code secure?', answer: 'It is a UI only. InputOtp masks the digits and accepts numbers; verifying the code is your server’s job.' },
        { question: 'Can I show positive amounts in green without relying on colour?', answer: 'They already carry a “+” sign; colour is an extra cue, never the only one.' }
    ],
    components: [
        'Avatar',
        'Breadcrumb',
        'Button',
        'Card',
        'Chart',
        'Checkbox',
        'DataTable',
        'DatePicker',
        'InputNumber',
        'InputOtp',
        'InputText',
        'Listbox',
        'Message',
        'MultiSelect',
        'ProgressBar',
        'Select',
        'Sidebar',
        'Stepper',
        'Tag'
    ],
    layout: defineAsyncComponent(() => import('./Layout.vue')),
    screens
};

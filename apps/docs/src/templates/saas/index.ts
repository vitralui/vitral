import { defineAsyncComponent } from 'vue';
import { sparkles } from '@vitral/icons';
import type { TemplateMeta } from '../types';
import { screens } from './screens';

export const template: TemplateMeta = {
    id: 'saas',
    name: 'Lumen Metrics',
    category: 'Dashboard',
    icon: sparkles,
    summary: 'A SaaS admin: revenue KPIs and charts, a customer table and settings.',
    description:
        'The back office of a subscription product. The overview leads with four KPIs and their trends, then revenue, plan mix and conversions; the customer table searches, filters, sorts, selects and pages; settings hold a profile form, notification switches and billing.',
    tags: ['Admin', 'Charts', 'Table'],
    features: [
        'KPI tiles with sparklines and deltas',
        'Area, bar and donut charts that take their colours from the theme',
        'A customer table with global search, a plan filter, sorting, selection and pages',
        'Settings in tabs: a profile form, notification switches, usage and plans',
        'A brand that switches workspace, and an account menu at the foot of the sidebar',
        'An inset sidebar that folds to icons on narrow screens'
    ],
    faq: [
        {
            question: 'Can the table load from an API?',
            answer: 'Yes. DataTable takes a data source or runs lazy: sorting, filtering and paging are handed to your server and the markup stays the same.'
        },
        {
            question: 'Why do the charts change colour with the theme?',
            answer: 'They read the --vt-chart-N tokens, which every preset defines for both schemes. Nothing in the template names a colour.'
        },
        {
            question: 'How does the sidebar behave on a phone?',
            answer: 'The shell watches its own width and folds the Sidebar to icons below 960px, so every screen stays one tap away without a drawer.'
        },
        {
            question: 'Is this the same as the old Analytics dashboard?',
            answer: 'It replaces it: the same idea, with real charts, more screens and a layout that responds to its width.'
        }
    ],
    components: [
        'Avatar',
        'Button',
        'Card',
        'Chart',
        'DataTable',
        'InputText',
        'Menu',
        'Message',
        'MeterGroup',
        'Select',
        'SelectButton',
        'Sidebar',
        'Tabs',
        'Tag',
        'Textarea',
        'ToggleSwitch',
        'Badge'
    ],
    layout: defineAsyncComponent(() => import('./Layout.vue')),
    screens
};

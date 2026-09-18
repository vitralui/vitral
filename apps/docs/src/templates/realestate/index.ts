import { defineAsyncComponent } from 'vue';
import { keyHouse } from '@vitral/icons';
import type { TemplateMeta } from '../types';
import { screens } from './screens';

export const template: TemplateMeta = {
    id: 'realestate',
    name: 'Northgate Homes',
    category: 'Commerce',
    icon: keyHouse,
    summary: 'A property site: search with a map, filtered listings and a home page with visit booking.',
    description:
        'A real-estate agency’s site. Search by area, type, budget and bedrooms, see the results as pins on a drawn map, narrow them down with a price range, then open a home to browse its photos, estimate the mortgage and pick a slot in the agent’s calendar.',
    tags: ['Real estate', 'Search', 'Booking'],
    features: [
        'A search panel whose filters are shared with the listings screen',
        'An illustrative map with price pins linked to the result cards',
        'Filters with a price range slider, type checkboxes and a bedroom switch',
        'Grid and list layouts with sorting and pages',
        'A property page with a gallery, a mortgage estimate and a bookable week in Schedule'
    ],
    faq: [
        {
            question: 'Is the map real?',
            answer: 'No — it is drawn with CSS so the template has no map dependency. The pins are positioned by percentages; swap the block for your map library and keep the pin buttons.'
        },
        {
            question: 'How does booking a visit work?',
            answer: 'Schedule runs in selectable mode: dragging across free time (or Shift with the arrow keys) emits a selection, which opens a Dialog to confirm.'
        },
        { question: 'Are the filters kept when I change screens?', answer: 'Yes. They live in one reactive object shared by the search and listings screens.' },
        {
            question: 'Is the mortgage maths right?',
            answer: 'It is the standard amortisation formula on the price minus the down payment, with no taxes or insurance. Treat it as a demonstration.'
        }
    ],
    components: [
        'Avatar',
        'Breadcrumb',
        'Button',
        'Checkbox',
        'Chip',
        'DataView',
        'Dialog',
        'Galleria',
        'InputNumber',
        'InputText',
        'Menu',
        'Message',
        'MultiSelect',
        'Schedule',
        'Select',
        'SelectButton',
        'Slider',
        'Tag'
    ],
    layout: defineAsyncComponent(() => import('./Layout.vue')),
    screens
};

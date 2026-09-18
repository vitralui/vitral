import { defineAsyncComponent } from 'vue';
import { plane } from '@vitral/icons';
import type { TemplateMeta } from '../types';
import { screens } from './screens';

export const template: TemplateMeta = {
    id: 'airline',
    name: 'Skylark Air',
    category: 'Travel',
    icon: plane,
    summary: 'A flight booking flow: search, results, seat selection and a verified payment.',
    description:
        'An airline’s booking journey from the first search to the booking reference. Pick a route, dates and travellers, compare flights on a date strip with filters, choose seats on a cabin map with extras, then review the itinerary and pay with a one-time code.',
    tags: ['Booking', 'Travel', 'Checkout'],
    features: [
        'A search form with filtered city pickers, date pickers and a travellers popover',
        'A price strip for nearby days, filters and sortable flight cards',
        'An accessible seat map: every seat a toggle button with its row, position and state',
        'Bags and travel cover with a running total',
        'A review with an itinerary timeline and a one-time-code payment'
    ],
    faq: [
        {
            question: 'Can a screen reader user pick a seat?',
            answer: 'Yes. Seats are buttons grouped by row, named like “Seat 14C, aisle”, with aria-pressed for the ones you hold and disabled for taken ones.'
        },
        {
            question: 'Where do the flights come from?',
            answer: 'A static list in data.ts. Replace it with your search API; the cards only need times, duration, stops and a price.'
        },
        {
            question: 'How is progress shown?',
            answer: 'A Stepper without panels sits above each booking screen, bound to the template’s current screen, so travellers can step back.'
        }
    ],
    components: [
        'Avatar',
        'Button',
        'Card',
        'Carousel',
        'Checkbox',
        'DatePicker',
        'Divider',
        'InputNumber',
        'InputOtp',
        'Menu',
        'Message',
        'Popover',
        'Select',
        'SelectButton',
        'Slider',
        'Stepper',
        'Tag',
        'Timeline',
        'ToggleSwitch'
    ],
    layout: defineAsyncComponent(() => import('./Layout.vue')),
    screens
};

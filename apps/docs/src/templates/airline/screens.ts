import { defineAsyncComponent } from 'vue';
import type { TemplateScreen } from '../types';

export const screens: TemplateScreen[] = [
    { id: 'search', name: 'Search', summary: 'Route, dates, passengers and cabin, with destination deals', component: defineAsyncComponent(() => import('./Search.vue')) },
    { id: 'results', name: 'Flights', summary: 'A date strip, filters and flight cards', component: defineAsyncComponent(() => import('./Results.vue')) },
    { id: 'seats', name: 'Seats', summary: 'A seat map, bags and cover', component: defineAsyncComponent(() => import('./Seats.vue')) },
    { id: 'summary', name: 'Summary', summary: 'Itinerary, price breakdown and a verified payment', component: defineAsyncComponent(() => import('./Summary.vue')) }
];

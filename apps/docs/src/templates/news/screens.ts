import { defineAsyncComponent } from 'vue';
import type { TemplateScreen } from '../types';

export const screens: TemplateScreen[] = [
    { id: 'front', name: 'Front page', summary: 'The lead story, top stories, sections and most read', component: defineAsyncComponent(() => import('./Front.vue')) },
    { id: 'article', name: 'Article', summary: 'Headline, byline, photo, body and related stories', component: defineAsyncComponent(() => import('./Article.vue')) },
    { id: 'section', name: 'Section', summary: 'One section’s stories, sortable and paginated', component: defineAsyncComponent(() => import('./Section.vue')) }
];

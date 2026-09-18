import { defineAsyncComponent } from 'vue';
import type { TemplateScreen } from '../types';

export const screens: TemplateScreen[] = [
    { id: 'board', name: 'Board', summary: 'A kanban board with WIP limits, filters and new tasks', component: defineAsyncComponent(() => import('./Board.vue')) },
    { id: 'timeline', name: 'Timeline', summary: 'Each person’s tasks across two weeks, in Schedule', component: defineAsyncComponent(() => import('./Timeline.vue')) },
    { id: 'team', name: 'Team', summary: 'People, workload and an invite form', component: defineAsyncComponent(() => import('./Team.vue')) }
];

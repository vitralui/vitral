import { defineAsyncComponent } from 'vue';
import { kanban } from '@vitral/icons';
import type { TemplateMeta } from '../types';
import { screens } from './screens';

export const template: TemplateMeta = {
    id: 'projects',
    name: 'Orbit',
    category: 'Productivity',
    icon: kanban,
    summary: 'Project management: a kanban board, a team timeline and workload.',
    description:
        'A small team shipping an app. The board moves cards between columns with a WIP limit, filters by person and priority, and creates tasks from any column; the timeline lays the same tasks out per person across weeks; the team page shows workload and invites people.',
    tags: ['Kanban', 'Timeline', 'Team'],
    features: [
        'A Taskboard with WIP limits, drag and drop, and full keyboard moves',
        'Filters by person and priority that keep hidden cards in place',
        'A new-task dialog from the toolbar or any column',
        'A resource timeline in Schedule: drag a bar to move it or reassign it',
        'Team cards with workload bars and an invite form',
        'A sidebar that floats off the page, with the board’s three views as a sub-list under it'
    ],
    faq: [
        {
            question: 'Can cards be moved without a mouse?',
            answer: 'Yes. Focus a card, press Space to pick it up, move it with the arrow keys and press Space again; the move is announced.'
        },
        {
            question: 'Are the board and the timeline the same data?',
            answer: 'They are. Both read the one tasks list, so a card created on the board shows up on the timeline, and a bar moved on the timeline changes its owner on the board.'
        },
        { question: 'What happens at a WIP limit?', answer: 'Taskboard marks the column and refuses drops past the limit, emitting drop-refused so you can explain why.' },
        {
            question: 'Why does the sidebar hold views under “Board”?',
            answer: 'Because the board is three places, not one. The sub-list and the board’s own buttons set the same view in data.ts, so whichever you reach for, the sidebar marks where you are.'
        },
        { question: 'How do I add swimlanes?', answer: 'Pass lanes and a lane-field to Taskboard — for example, one lane per person.' }
    ],
    components: ['Avatar', 'Button', 'Card', 'Dialog', 'InputText', 'Message', 'ProgressBar', 'Schedule', 'Select', 'SelectButton', 'Sidebar', 'Tag', 'Taskboard'],
    layout: defineAsyncComponent(() => import('./Layout.vue')),
    screens
};

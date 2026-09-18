import { ref } from 'vue';
import type { TaskboardColumn } from '@vitral/vue';

/** Orbit — a made-up project tool, tracking the launch of a made-up app. */
export interface Member {
    id: string;
    name: string;
    initials: string;
    role: string;
    photo?: number;
    capacity: number;
    color: string;
}

export const team: Member[] = [
    { id: 'ana', name: 'Ana Ferraz', initials: 'AF', role: 'Product lead', photo: 64, capacity: 32, color: 'var(--vt-chart-1)' },
    { id: 'kofi', name: 'Kofi Mensah', initials: 'KM', role: 'Engineer', photo: 1005, capacity: 40, color: 'var(--vt-chart-2)' },
    { id: 'lea', name: 'Léa Girard', initials: 'LG', role: 'Designer', photo: 65, capacity: 36, color: 'var(--vt-chart-3)' },
    { id: 'raj', name: 'Raj Patel', initials: 'RP', role: 'Engineer', capacity: 40, color: 'var(--vt-chart-4)' },
    { id: 'mia', name: 'Mia Schultz', initials: 'MS', role: 'QA', photo: 91, capacity: 30, color: 'var(--vt-chart-5)' }
];

export const memberOf = (id: string) => team.find((member) => member.id === id) ?? team[0]!;

export interface Task {
    id: number;
    title: string;
    status: string;
    owner: string;
    tag: 'Design' | 'Frontend' | 'Backend' | 'QA' | 'Launch';
    priority: 'Low' | 'Medium' | 'High';
    due: string;
    points: number;
    comments: number;
    /** Days from today, for the timeline. */
    start: number;
    length: number;
}

export const columns = ref<TaskboardColumn[]>([
    { key: 'backlog', title: 'Backlog', color: 'var(--vt-chart-8)' },
    { key: 'todo', title: 'To do', color: 'var(--vt-chart-4)' },
    { key: 'doing', title: 'In progress', wipLimit: 3, color: 'var(--vt-chart-5)' },
    { key: 'review', title: 'In review', color: 'var(--vt-chart-2)' },
    { key: 'done', title: 'Done', color: 'var(--vt-chart-3)' }
]);

export const tasks = ref<Task[]>([
    { id: 1, title: 'Onboarding flow copy', status: 'backlog', owner: 'ana', tag: 'Launch', priority: 'Low', due: 'Oct 3', points: 2, comments: 1, start: 9, length: 3 },
    { id: 2, title: 'Pricing page layout', status: 'todo', owner: 'lea', tag: 'Design', priority: 'High', due: 'Sep 24', points: 5, comments: 4, start: 2, length: 4 },
    { id: 3, title: 'Offline sync for notes', status: 'todo', owner: 'raj', tag: 'Backend', priority: 'Medium', due: 'Sep 30', points: 8, comments: 2, start: 3, length: 6 },
    { id: 4, title: 'Settings screen', status: 'doing', owner: 'kofi', tag: 'Frontend', priority: 'High', due: 'Sep 20', points: 5, comments: 6, start: -2, length: 5 },
    { id: 5, title: 'Push notification service', status: 'doing', owner: 'raj', tag: 'Backend', priority: 'High', due: 'Sep 22', points: 8, comments: 3, start: -3, length: 7 },
    { id: 6, title: 'Empty states illustration', status: 'review', owner: 'lea', tag: 'Design', priority: 'Low', due: 'Sep 18', points: 3, comments: 2, start: -4, length: 4 },
    { id: 7, title: 'Regression suite for sign-in', status: 'review', owner: 'mia', tag: 'QA', priority: 'Medium', due: 'Sep 19', points: 3, comments: 0, start: -1, length: 3 },
    { id: 8, title: 'App store screenshots', status: 'backlog', owner: 'lea', tag: 'Launch', priority: 'Medium', due: 'Oct 6', points: 3, comments: 0, start: 8, length: 4 },
    { id: 9, title: 'Sign-in with passkeys', status: 'done', owner: 'kofi', tag: 'Frontend', priority: 'High', due: 'Sep 12', points: 8, comments: 9, start: -9, length: 6 },
    { id: 10, title: 'Beta feedback triage', status: 'done', owner: 'ana', tag: 'Launch', priority: 'Medium', due: 'Sep 14', points: 2, comments: 12, start: -6, length: 3 },
    { id: 11, title: 'Accessibility audit', status: 'todo', owner: 'mia', tag: 'QA', priority: 'High', due: 'Sep 26', points: 5, comments: 1, start: 4, length: 5 }
]);

export const tagSeverity = (tag: Task['tag']) =>
    ({ Design: 'info', Frontend: 'success', Backend: 'warn', QA: 'secondary', Launch: 'contrast' })[tag] as 'info' | 'success' | 'warn' | 'secondary' | 'contrast';
export const prioritySeverity = (priority: Task['priority']) => (priority === 'High' ? 'danger' : priority === 'Medium' ? 'warn' : 'secondary');

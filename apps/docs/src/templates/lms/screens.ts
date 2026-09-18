import { defineAsyncComponent } from 'vue';
import type { TemplateScreen } from '../types';

export const screens: TemplateScreen[] = [
    { id: 'courses', name: 'Courses', summary: 'Continue learning and a filterable course catalogue', component: defineAsyncComponent(() => import('./Courses.vue')) },
    { id: 'lesson', name: 'Lesson', summary: 'A video lesson with the syllabus, progress and notes', component: defineAsyncComponent(() => import('./Lesson.vue')) },
    { id: 'calendar', name: 'Calendar', summary: 'Classes and deadlines in Schedule', component: defineAsyncComponent(() => import('./Calendar.vue')) },
    { id: 'grades', name: 'Grades', summary: 'Scores by course, an average and a gradebook table', component: defineAsyncComponent(() => import('./Grades.vue')) }
];

import { defineAsyncComponent } from 'vue';
import { graduationCap } from '@vitral/icons';
import type { TemplateMeta } from '../types';
import { screens } from './screens';

export const template: TemplateMeta = {
    id: 'lms',
    name: 'Brightpath Academy',
    category: 'Education',
    icon: graduationCap,
    summary: 'A learning platform: courses, a video lesson, a class calendar and grades.',
    description:
        'A student’s side of an online school. Pick up where you left off, browse and filter the catalogue, follow a lesson with its syllabus, notes and discussion, see classes and deadlines in a calendar, and track scores in a gradebook.',
    tags: ['Education', 'Video', 'Calendar'],
    features: [
        'A continue-learning card and progress on every course in flight',
        'A course catalogue with subject filters and search',
        'A lesson page with a syllabus accordion, completion tracking, notes and discussion',
        'A calendar with recurring classes and all-day deadlines, in month, week and agenda views',
        'Grades with a weighted average, a chart per course and a sortable gradebook'
    ],
    faq: [
        {
            question: 'Does the video play?',
            answer: 'The player is a placeholder with a play button, so the template has no media dependency. Put your player in the .tp-video box.'
        },
        {
            question: 'Can students move events in the calendar?',
            answer: 'Schedule supports dragging and keyboard moves; they are off here because a class timetable is not the student’s to change. Add editable and handle event-change to allow it.'
        },
        {
            question: 'How is lesson progress kept?',
            answer: 'In a reactive copy of the syllabus. Marking a lesson complete ticks it, updates the course knob and moves on to the next one.'
        },
        {
            question: 'Is the gradebook accessible?',
            answer: 'It is a real table with a caption and sortable column headers; each score bar carries a label as well as the number beside it.'
        }
    ],
    components: [
        'Accordion',
        'Avatar',
        'Breadcrumb',
        'Button',
        'Card',
        'Chart',
        'DataTable',
        'DataView',
        'InputText',
        'Knob',
        'Message',
        'MeterGroup',
        'ProgressBar',
        'Rating',
        'Schedule',
        'SelectButton',
        'Sidebar',
        'Tabs',
        'Tag',
        'Textarea'
    ],
    layout: defineAsyncComponent(() => import('./Layout.vue')),
    screens
};

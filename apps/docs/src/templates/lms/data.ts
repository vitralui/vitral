import { reactive } from 'vue';

/** Brightpath Academy: a made-up online school with made-up courses and teachers. */
export interface Course {
    id: number;
    title: string;
    teacher: string;
    subject: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    lessons: number;
    hours: number;
    rating: number;
    students: number;
    photo: number;
    progress: number;
}

export const courses: Course[] = [
    {
        id: 1,
        title: 'Interface design fundamentals',
        teacher: 'Dr. Lina Okoye',
        subject: 'Design',
        level: 'Beginner',
        lessons: 24,
        hours: 9,
        rating: 4.8,
        students: 12840,
        photo: 20,
        progress: 62
    },
    {
        id: 2,
        title: 'Photography: light and composition',
        teacher: 'Matteo Rinaldi',
        subject: 'Arts',
        level: 'Beginner',
        lessons: 18,
        hours: 6,
        rating: 4.9,
        students: 9312,
        photo: 250,
        progress: 35
    },
    {
        id: 3,
        title: 'Data analysis with spreadsheets',
        teacher: 'Hye-jin Seo',
        subject: 'Data',
        level: 'Intermediate',
        lessons: 30,
        hours: 12,
        rating: 4.6,
        students: 20455,
        photo: 0,
        progress: 0
    },
    {
        id: 4,
        title: 'Listening closely: records and rooms',
        teacher: 'Colette Dubois',
        subject: 'Music',
        level: 'Beginner',
        lessons: 40,
        hours: 14,
        rating: 4.7,
        students: 5120,
        photo: 39,
        progress: 12
    },
    {
        id: 5,
        title: 'Night sky: an introduction to astronomy',
        teacher: 'Prof. Amir Karimi',
        subject: 'Science',
        level: 'Beginner',
        lessons: 16,
        hours: 5,
        rating: 4.9,
        students: 7765,
        photo: 967,
        progress: 0
    },
    {
        id: 6,
        title: 'Writing that people finish',
        teacher: 'Ruth Castellano',
        subject: 'Writing',
        level: 'Intermediate',
        lessons: 20,
        hours: 7,
        rating: 4.5,
        students: 6021,
        photo: 403,
        progress: 100
    },
    {
        id: 7,
        title: 'Typography in practice',
        teacher: 'Dr. Lina Okoye',
        subject: 'Design',
        level: 'Advanced',
        lessons: 22,
        hours: 10,
        rating: 4.8,
        students: 3310,
        photo: 1073,
        progress: 0
    },
    {
        id: 8,
        title: 'Remote teamwork that works',
        teacher: 'Jonas Albrecht',
        subject: 'Business',
        level: 'Intermediate',
        lessons: 12,
        hours: 4,
        rating: 4.4,
        students: 11203,
        photo: 180,
        progress: 0
    }
];

export const subjects = ['All', ...new Set(courses.map((course) => course.subject))];

export const syllabus = [
    {
        key: 'm1',
        title: 'Module 1 · Seeing the interface',
        lessons: [
            { key: 'l1', title: 'What an interface is for', minutes: 8, done: true },
            { key: 'l2', title: 'Hierarchy and reading order', minutes: 12, done: true },
            { key: 'l3', title: 'Grids without the dogma', minutes: 15, done: true }
        ]
    },
    {
        key: 'm2',
        title: 'Module 2 · Controls and states',
        lessons: [
            { key: 'l4', title: 'Buttons, links and what they promise', minutes: 11, done: true },
            { key: 'l5', title: 'Designing every state of a field', minutes: 14, done: false },
            { key: 'l6', title: 'Feedback, errors and empty screens', minutes: 13, done: false }
        ]
    },
    {
        key: 'm3',
        title: 'Module 3 · Colour and type',
        lessons: [
            { key: 'l7', title: 'Colour as meaning', minutes: 10, done: false },
            { key: 'l8', title: 'Type scales that hold up', minutes: 16, done: false }
        ]
    }
];

export const school = reactive({ courseId: 1, lessonKey: 'l5' });

export const courseOf = (id: number) => courses.find((course) => course.id === id) ?? courses[0]!;

export const grades = [
    { id: 1, course: 'Interface design fundamentals', item: 'Critique: a banking app', due: 'Aug 30', weight: 20, score: 92, status: 'Graded' },
    { id: 2, course: 'Interface design fundamentals', item: 'Quiz: hierarchy', due: 'Sep 6', weight: 10, score: 85, status: 'Graded' },
    { id: 3, course: 'Photography: light and composition', item: 'Assignment: golden hour', due: 'Sep 8', weight: 25, score: 78, status: 'Graded' },
    { id: 4, course: 'Writing that people finish', item: 'Final essay', due: 'Sep 10', weight: 40, score: 96, status: 'Graded' },
    { id: 5, course: 'Listening closely: records and rooms', item: 'Essay: one album, one room', due: 'Sep 12', weight: 15, score: 70, status: 'Graded' },
    { id: 6, course: 'Interface design fundamentals', item: 'Project: a settings screen', due: 'Sep 20', weight: 30, score: null, status: 'Submitted' },
    { id: 7, course: 'Photography: light and composition', item: 'Assignment: portraits', due: 'Sep 24', weight: 25, score: null, status: 'Not started' }
];

export const initials = (name: string) =>
    name
        .replace(/^(Dr|Prof)\. /, '')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2);

import { defineAsyncComponent } from 'vue';
import { bookOpen } from '@vitral/icons';
import type { TemplateMeta } from '../types';
import { screens } from './screens';

export const template: TemplateMeta = {
    id: 'news',
    name: 'The Lantern',
    category: 'Publishing',
    icon: bookOpen,
    summary: 'A news site: a front page, an article page and paginated sections.',
    description:
        'A daily paper with a clear hierarchy: a lead story and top stories above the fold, section rows below, and a most-read rail. Articles carry a byline, reading time, a captioned photo, pull quotes and related stories; each section pages through its archive.',
    tags: ['News', 'Editorial', 'Content'],
    features: [
        'A front page with a lead, top stories, section rows and a most-read list',
        'Section links in the header that open one section screen in the right state',
        'An article page with byline, reading time, share and save actions, and a pull quote',
        'A section archive with a lead story, an order switch and pages',
        'A newsletter sign-up and a metered-reading card'
    ],
    faq: [
        {
            question: 'Where does the article body come from?',
            answer: 'In the template it is written inline. In an application it would come from your CMS as HTML or blocks — the tp-prose class styles paragraphs, headings and quotes.'
        },
        { question: 'Are the photos included?', answer: 'They are loaded from picsum.photos by id, as placeholders. Swap the photo() helper for your own image URLs.' },
        {
            question: 'How are the stories made accessible?',
            answer: 'Each teaser is one button with the headline as its name, the page uses real headings in order, and decorative images have empty alt text.'
        },
        { question: 'Can the header hold more sections?', answer: 'Yes. Below 720px the links move into a menu, so the list can grow without breaking the bar.' }
    ],
    components: ['Avatar', 'Breadcrumb', 'Button', 'Chip', 'DataView', 'Divider', 'InputText', 'Menu', 'Message', 'ProgressBar', 'SelectButton', 'Tag'],
    layout: defineAsyncComponent(() => import('./Layout.vue')),
    screens
};

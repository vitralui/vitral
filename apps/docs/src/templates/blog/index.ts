import { defineAsyncComponent } from 'vue';
import { pencilLine } from '@vitral/icons';
import type { TemplateMeta } from '../types';
import { screens } from './screens';

export const template: TemplateMeta = {
    id: 'blog',
    name: 'Field Notes',
    category: 'Publishing',
    icon: pencilLine,
    summary: 'A personal blog: posts with tags, a post page with comments, and an about page.',
    description:
        'A calm, readable blog for one author. The index leads with the latest post and filters the rest by tag; a post has an author line, reading time, a table of contents, likes and a comment form; the about page tells the story with a timeline and ends with a contact form.',
    tags: ['Blog', 'Personal', 'Content'],
    features: [
        'A featured post and a list you can filter by tag',
        'Post pages with author, date, reading time and contents',
        'Likes, a comment thread and a comment form',
        'Previous and next post navigation',
        'An about page with a career timeline and a contact form'
    ],
    faq: [
        { question: 'Can I use Markdown for the posts?', answer: 'Yes — render it to HTML inside a tp-prose block and it picks up the same type styles as the sample post.' },
        { question: 'Do the comments work?', answer: 'They are kept in memory for the session. Point the send handler at your comment service to keep them.' },
        {
            question: 'How is the tag filter shared between screens?',
            answer: 'The selected tag lives in the template’s small reactive store, so tagging from a post opens the index already filtered.'
        },
        { question: 'Is the reading width fixed?', answer: 'The article column is capped at 44rem so lines stay readable; images and the comment form span that same column.' }
    ],
    components: ['Avatar', 'Button', 'Card', 'Divider', 'InputText', 'Menu', 'Message', 'Tag', 'Textarea', 'Timeline'],
    layout: defineAsyncComponent(() => import('./Layout.vue')),
    screens
};

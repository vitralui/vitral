import { defineAsyncComponent } from 'vue';
import type { TemplateScreen } from '../types';

export const screens: TemplateScreen[] = [
    { id: 'posts', name: 'Posts', summary: 'A featured post and a list filtered by tag', component: defineAsyncComponent(() => import('./Posts.vue')) },
    { id: 'post', name: 'Post', summary: 'Author, reading time, contents, body and comments', component: defineAsyncComponent(() => import('./Post.vue')) },
    { id: 'about', name: 'About', summary: 'A bio, a timeline and a contact form', component: defineAsyncComponent(() => import('./About.vue')) }
];

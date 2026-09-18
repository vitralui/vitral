import { defineAsyncComponent } from 'vue';
import type { TemplateScreen } from '../types';

export const screens: TemplateScreen[] = [
    { id: 'signin', name: 'Sign in', summary: 'One centred card: the door to an application', component: defineAsyncComponent(() => import('./SignIn.vue')) },
    { id: 'split', name: 'Split screen', summary: 'The same form beside a panel that carries the brand', component: defineAsyncComponent(() => import('./Split.vue')) },
    { id: 'modal', name: 'In a dialog', summary: 'Signing in over the page, without leaving it', component: defineAsyncComponent(() => import('./Modal.vue')) },
    { id: 'signup', name: 'Create an account', summary: 'A chosen password, a strength meter and a consent', component: defineAsyncComponent(() => import('./SignUp.vue')) },
    { id: 'recover', name: 'Reset a password', summary: 'Email, a six-digit code and a new password, as three steps', component: defineAsyncComponent(() => import('./Recover.vue')) }
];

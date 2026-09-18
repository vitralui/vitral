import { defineAsyncComponent } from 'vue';
import { lock } from '@vitral/icons';
import type { TemplateMeta } from '../types';
import { screens } from './screens';

export const template: TemplateMeta = {
    id: 'auth',
    name: 'Meridian Access',
    category: 'Authentication',
    icon: lock,
    summary: 'The screens before the application: sign in on a card, beside a panel or in a dialog, sign up, and reset a password.',
    description:
        'Every application starts with one of these and most galleries leave them out. Five screens over one form: a centred card, a split screen with a brand panel, the same form in a modal over a landing page, creating an account with a strength meter and a consent, and a three-step password reset with a six-digit code. The form is one component throughout, which is the point: three ways to present it, one thing to keep working.',
    tags: ['Auth', 'Forms', 'Dialog'],
    features: [
        'One SignInForm component behind the card, the split screen and the dialog',
        'A password box with a toggle, and a strength meter where the password is being chosen',
        'A modal sign-in that keeps the page behind it, scroll position and all',
        'A three-step reset: email, a six-digit InputOtp code with a resend timer, a new password',
        'Errors shown on the field and in a message, never only in colour'
    ],
    faq: [
        {
            question: 'Why is the form a separate component?',
            answer: 'Because it is shown three ways. A dialog that reimplements the sign-in is a second form to keep in step, and the one that gets forgotten is always the one behind the button.'
        },
        {
            question: 'Does any of this authenticate anybody?',
            answer: 'No. The screens show the states — idle, working, refused, done — and leave the request to you. Nothing here posts anywhere.'
        },
        {
            question: 'Can I use the split screen with my own artwork?',
            answer: 'Yes. The panel is an <aside> with the brand inside it; put an image, a gradient or a video there. It is the first thing to go at phone width, where the form is the whole page.'
        },
        {
            question: 'Why a stepper for the reset rather than three pages?',
            answer: 'A stepper shows how much is left and makes going back one step free. Linear mode keeps the reader from skipping the code.'
        }
    ],
    components: ['Button', 'Checkbox', 'Dialog', 'Divider', 'InputOtp', 'InputText', 'Message', 'InputPassword', 'Select', 'Stepper', 'Tag'],
    layout: defineAsyncComponent(() => import('./Layout.vue')),
    screens
};

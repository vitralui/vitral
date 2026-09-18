import { defineAsyncComponent } from 'vue';
import { storefront } from '@vitral/icons';
import type { TemplateMeta } from '../types';
import { screens } from './screens';

export const template: TemplateMeta = {
    id: 'ecommerce',
    name: 'Fernhill Supply',
    category: 'Commerce',
    icon: storefront,
    summary: 'An online store: catalogue, product page, cart and a three-step checkout.',
    description:
        'A complete storefront for a small home-goods brand. Browse by room, sort the grid, open a product to pick a colour and size, and carry it through a cart with a coupon to a checkout that validates each step before letting you on.',
    tags: ['Store', 'Checkout', 'Catalogue'],
    features: [
        'Hero, category tiles and a product grid you can filter and sort',
        'Product page with a photo gallery, variants, quantity and reviews',
        'A cart that recalculates as you edit it, with a working coupon (FERN10)',
        'A linear checkout: shipping, masked payment fields, review',
        'Shared cart state across every screen, with a live badge in the header'
    ],
    faq: [
        {
            question: 'Does it take real payments?',
            answer: 'No. The checkout validates its fields and shows a confirmation, but there is no payment provider behind it — wire your own into the place-order handler.'
        },
        {
            question: 'Where does the product data come from?',
            answer: 'From data.ts, as plain objects. Replace the arrays with a fetch, or with a DataView bound to a data source, and the screens keep working.'
        },
        {
            question: 'How does the layout adapt to a phone?',
            answer: 'Through container queries on the template root, so it adapts to the space it is given — a preview frame or a whole window. The header links fold into a menu below 720px.'
        },
        {
            question: 'Can I change the look?',
            answer: 'Every colour, radius and shadow comes from the active preset. Switch the theme above the preview, or pass your own preset to the Vitral plugin.'
        }
    ],
    components: [
        'Breadcrumb',
        'Button',
        'Carousel',
        'Checkbox',
        'DataView',
        'Divider',
        'Galleria',
        'InputGroup',
        'InputMask',
        'InputNumber',
        'InputText',
        'Menu',
        'Message',
        'Badge',
        'RadioButton',
        'Rating',
        'Select',
        'SelectButton',
        'Stepper',
        'Tabs',
        'Tag',
        'Avatar'
    ],
    layout: defineAsyncComponent(() => import('./Layout.vue')),
    screens
};

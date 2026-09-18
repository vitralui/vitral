import { defineStyle } from '../defineStyle';
import css from './breadcrumb.css?raw';

export interface BreadcrumbItemState {
    /** The page the user is on: the last item. */
    current?: boolean;
    disabled?: boolean;
    /** The item goes somewhere or does something — a link or a button rather than text. */
    action?: boolean;
}

export const breadcrumbStyle = defineStyle({
    name: 'breadcrumb',
    css,
    classes: {
        root: 'vt-breadcrumb',
        list: 'vt-breadcrumb-list',
        item: (s: BreadcrumbItemState) => ['vt-breadcrumb-item', { 'vt-breadcrumb-item-current': s.current }],
        link: (s: BreadcrumbItemState) => [
            'vt-breadcrumb-link',
            { 'vt-breadcrumb-link-current': s.current, 'vt-breadcrumb-link-disabled': s.disabled, 'vt-breadcrumb-link-action': s.action && !s.disabled }
        ],
        itemIcon: 'vt-breadcrumb-item-icon',
        itemLabel: 'vt-breadcrumb-item-label',
        /** Text only assistive technology reads: the name of an icon-only home item. */
        hiddenLabel: 'vt-sr-only',
        separator: 'vt-breadcrumb-separator'
    }
});

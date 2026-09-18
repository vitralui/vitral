import type { BaseProps } from '../../base/types';
import type { MenuItem } from '../Menu/types';

export interface SidebarProps extends BaseProps {
    /**
     * The navigation. A top-level item with `items` is a labelled group; an
     * item with `items` inside a group opens a sub-list in place. Items are
     * links (`url`) or buttons (`command`).
     */
    model?: MenuItem[];
    /** How it collapses: to its icons (the default), off the canvas entirely, or not at all. */
    collapsible?: 'icon' | 'offcanvas' | 'none';
    /** Which edge it sits on. Defaults to `'left'`. */
    side?: 'left' | 'right';
    /** The key of the item for the current page; it is marked `aria-current="page"`. Items with `active` are marked too. */
    activeKey?: string;
    /** Below this width it becomes a drawer opened with `v-model:visible`. Defaults to `'768px'`. */
    mobileBreakpoint?: string;
    /** Show the collapse button in the header. Defaults to true. */
    showToggle?: boolean;
    /** Names the navigation. Defaults to the locale's "Navigation". */
    ariaLabel?: string;
}

export type SidebarEmits = {
    'item-click': [event: { originalEvent: Event; item: MenuItem }];
};

export interface SidebarSlots {
    /** Above the navigation: a logo, a workspace switcher. */
    header?: (props: { collapsed: boolean }) => unknown;
    /** Below it: the signed-in user. */
    footer?: (props: { collapsed: boolean }) => unknown;
    /** More content after the model's groups. */
    default?: (props: { collapsed: boolean }) => unknown;
    /** An item's content. */
    item?: (props: { item: MenuItem; collapsed: boolean; active: boolean }) => unknown;
}

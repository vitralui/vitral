import type { BaseProps, IconProp, OverlayPlacement } from '../../base/types';

export interface MenuItemCommandEvent {
    originalEvent: Event;
    item: MenuItem;
}

/** One entry of a menu model. */
export interface MenuItem {
    label?: string;
    icon?: IconProp;
    /** Runs when the item is activated: click, Enter or Space. */
    command?: (event: MenuItemCommandEvent) => void;
    /** Renders the item as a link. */
    url?: string;
    target?: string;
    disabled?: boolean;
    /** `false` leaves the item out. */
    visible?: boolean;
    separator?: boolean;
    /** Makes the item a group: its label heads the group, these are its items. One level deep. */
    items?: MenuItem[];
    /** Classes for the item's `<li>`. */
    class?: string | string[] | Record<string, boolean>;
    /** A stable key for rendering; the position is used without one. */
    key?: string;
    [field: string]: unknown;
}

export interface MenuProps extends BaseProps {
    model?: MenuItem[];
    /** A popup menu, opened by `toggle(event)` / `show(event)` and anchored to the event's element. */
    popup?: boolean;
    /** Where a popup renders: `'body'` (the default), `'self'` to stay in place, or a selector. */
    appendTo?: string;
    placement?: OverlayPlacement;
    /** Names the menu. A popup without one is named by the element that opened it. */
    ariaLabel?: string;
    ariaLabelledby?: string;
}

export type MenuEmits = {
    show: [];
    hide: [];
};

export interface MenuSlots {
    /** Content before the items. */
    start?: () => unknown;
    /** Content after the items. */
    end?: () => unknown;
    /** An item's content: its icon and label. The menuitem element around it, with its role and keyboard, stays. */
    item?: (props: { item: MenuItem; label: string | undefined; focused: boolean; disabled: boolean }) => unknown;
    /** A group's heading. */
    submenulabel?: (props: { item: MenuItem }) => unknown;
}

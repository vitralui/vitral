import type { BaseProps, IconProp } from '../../base/types';

export interface BreadcrumbItemCommandEvent {
    originalEvent: Event;
    item: BreadcrumbItem;
}

export interface BreadcrumbItem {
    label?: string;
    icon?: IconProp;
    /** Renders the item as a link. */
    url?: string;
    target?: string;
    /** Renders the item as a button that runs this. */
    command?: (event: BreadcrumbItemCommandEvent) => void;
    disabled?: boolean;
    /** `false` leaves the item out. */
    visible?: boolean;
    /** Classes for the item's `<li>`. */
    class?: string | string[] | Record<string, boolean>;
    key?: string;
    [field: string]: unknown;
}

export interface BreadcrumbProps extends BaseProps {
    /** The trail, root first; the last item is the current page. */
    model?: BreadcrumbItem[];
    /** An item before the trail. Shows the home icon when it has neither label nor icon. */
    home?: BreadcrumbItem;
}

export interface BreadcrumbSlots {
    /** An item's content — its icon and label; the link or button around it stays. */
    item?: (props: { item: BreadcrumbItem; label: string | undefined; current: boolean }) => unknown;
    /** Replaces the chevron between items. */
    separator?: () => unknown;
}

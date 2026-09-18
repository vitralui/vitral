import type { BaseProps } from '../../base/types';

export interface OrderListProps extends BaseProps {
    /** Field (dotted path) holding an item's text, for the default template and the announcements. */
    optionLabel?: string;
    /** A field that identifies an item. */
    dataKey?: string;
    /** The list's title; it names the list. Without one, name it with `aria-label`. */
    header?: string;
    /** Let items be dragged to a new place. Defaults to true. */
    dragdrop?: boolean;
    /** Show the move buttons. Defaults to true. */
    showControls?: boolean;
    /** The list's height. */
    scrollHeight?: string;
    disabled?: boolean;
}

export type OrderListEmits = {
    reorder: [event: { originalEvent?: Event; value: unknown[]; direction: 'up' | 'down' | 'top' | 'bottom' | 'drop' }];
};

export interface OrderListSlots {
    /** An item's content. */
    option?: (props: { item: unknown; index: number; selected: boolean }) => unknown;
    /** Replaces the title. */
    header?: () => unknown;
}

import type { BaseProps, Size } from '../../base/types';

export interface DescriptionListItem {
    label: string;
    value?: string | number | null;
    /** Columns this item takes, when there are several. */
    span?: number;
    /** Identifies the item for the `value` slot and as its key; the label otherwise. */
    key?: string | number;
}

export interface DescriptionListProps extends BaseProps {
    items?: DescriptionListItem[];
    title?: string;
    /** Side by side on a wide list; they fold into one when the list is narrow. Defaults to 1. */
    columns?: number;
    /** Label above its value (the default), or beside it. */
    layout?: 'vertical' | 'horizontal';
    /** Every item in a cell of one bordered block. */
    bordered?: boolean;
    striped?: boolean;
    size?: Size;
    /** Shown for an item with no value. Defaults to an em dash. */
    emptyValue?: string;
    /** The width of the labels in the horizontal layout. */
    labelWidth?: string;
    /** Make the title a heading of this level. */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface DescriptionListSlots {
    title?: () => unknown;
    /** Beside the title: an edit button. */
    extra?: () => unknown;
    label?: (context: { item: DescriptionListItem; index: number }) => unknown;
    value?: (context: { item: DescriptionListItem; index: number }) => unknown;
}

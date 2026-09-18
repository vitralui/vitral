import type { BaseProps } from '../../base/types';

export interface PickListProps extends BaseProps {
    /** Field (dotted path) holding an item's text, for the default template and the announcements. */
    optionLabel?: string;
    /** A field that identifies an item. */
    dataKey?: string;
    /** Names the first list. Defaults to the locale's "Available". */
    sourceHeader?: string;
    /** Names the second list. Defaults to the locale's "Selected". */
    targetHeader?: string;
    /** Show the move buttons beside the first list. Defaults to true. */
    showSourceControls?: boolean;
    /** Show the move buttons beside the second list. Defaults to true. */
    showTargetControls?: boolean;
    /** The lists' height. */
    scrollHeight?: string;
    disabled?: boolean;
}

export type PickListEmits = {
    'move-to-target': [event: { items: unknown[] }];
    'move-all-to-target': [event: { items: unknown[] }];
    'move-to-source': [event: { items: unknown[] }];
    'move-all-to-source': [event: { items: unknown[] }];
    reorder: [event: { list: 'source' | 'target'; value: unknown[] }];
};

export interface PickListSlots {
    /** An item's content, in either list. */
    option?: (props: { item: unknown; index: number; selected: boolean; list: 'source' | 'target' }) => unknown;
    sourceheader?: () => unknown;
    targetheader?: () => unknown;
}

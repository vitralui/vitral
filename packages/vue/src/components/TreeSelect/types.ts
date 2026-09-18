import type { BaseProps, InputVariant, OverlayPlacement, Size } from '../../base/types';
import type { TreeNodeLike } from '../Tree/types';

export interface TreeSelectProps extends BaseProps {
    /** The tree to choose from. */
    options?: TreeNodeLike[];
    /** `'single'` (the default) closes on a choice; `'multiple'` and `'checkbox'` stay open. */
    selectionMode?: 'single' | 'multiple' | 'checkbox';
    placeholder?: string;
    /** How the choice is shown: a comma-separated list (the default) or chips. */
    display?: 'comma' | 'chip';
    /** Past this many, the field says how many are chosen instead of naming them. */
    maxSelectedLabels?: number;
    /** What it says then. `{count}`; defaults to the locale's selection message. */
    selectedItemsLabel?: string;
    /** Adds a search box above the tree. */
    filter?: boolean;
    /** Node fields to search, as a list or comma-separated. Defaults to `label`. */
    filterBy?: string | string[];
    filterPlaceholder?: string;
    emptyMessage?: string;
    showClear?: boolean;
    loading?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    size?: Size;
    variant?: InputVariant;
    fluid?: boolean;
    placement?: OverlayPlacement;
    /** `'body'` (the default), `'self'` to render in place, or a selector. */
    appendTo?: string;
}

/** `{ [key]: true }` in single and multiple mode; `{ [key]: { checked, partialChecked } }` in checkbox mode. */
export type TreeSelectValue = Record<string, boolean | { checked: boolean; partialChecked: boolean }>;

export type TreeSelectEmits = {
    change: [value: TreeSelectValue];
    'node-select': [node: TreeNodeLike];
    'node-unselect': [node: TreeNodeLike];
    'node-expand': [node: TreeNodeLike];
    'node-collapse': [node: TreeNodeLike];
    filter: [query: string];
    show: [];
    hide: [];
    focus: [event: FocusEvent];
    blur: [event: FocusEvent];
};

export interface TreeSelectSlots {
    /** The field's content. */
    value?: (props: { value: TreeNodeLike[]; placeholder?: string }) => unknown;
    /** A node's content in the tree. */
    option?: (props: { node: TreeNodeLike; expanded: boolean; selected: boolean; checked: boolean }) => unknown;
    header?: () => unknown;
    footer?: () => unknown;
    empty?: () => unknown;
    dropdownicon?: (props: { open: boolean }) => unknown;
}

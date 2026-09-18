import type { BaseProps, IconProp } from '../../base/types';

/** The shape of a node — the same as `TreeNode` in `@vitral/core`, restated here for the SFC compiler. */
export interface TreeNodeLike {
    key: string;
    label?: string;
    data?: unknown;
    /** A built-in icon name, or a class for an icon font. */
    icon?: IconProp;
    children?: TreeNodeLike[];
    /** `false` makes a node expandable before its children are loaded. */
    leaf?: boolean;
    selectable?: boolean;
    disabled?: boolean;
    /** Shows a spinner in the toggle while the app loads the children. */
    loading?: boolean;
    [extra: string]: unknown;
}

export type TreeExpandedKeys = Record<string, boolean>;

/** `{ [key]: true }` in single and multiple mode; `{ [key]: { checked, partialChecked } }` in checkbox mode. */
export type TreeSelectionKeys = Record<string, boolean | { checked: boolean; partialChecked: boolean }>;

export interface TreeProps extends BaseProps {
    value?: TreeNodeLike[];
    selectionMode?: 'single' | 'multiple' | 'checkbox';
    /** Adds a search box; matches stay visible with the branches that lead to them, expanded. */
    filter?: boolean;
    /** Node fields to search, as a list or comma-separated. Defaults to `label`. */
    filterBy?: string | string[];
    filterPlaceholder?: string;
    loading?: boolean;
    /** The tree's maximum height before it scrolls. */
    scrollHeight?: string;
    emptyMessage?: string;
}

export type TreeEmits = {
    'node-expand': [node: TreeNodeLike];
    'node-collapse': [node: TreeNodeLike];
    'node-select': [node: TreeNodeLike];
    'node-unselect': [node: TreeNodeLike];
    filter: [query: string];
};

export interface TreeNodeSlotProps {
    node: TreeNodeLike;
    expanded: boolean;
    selected: boolean;
    checked: boolean;
    partialChecked: boolean;
    level: number;
    leaf: boolean;
}

export interface TreeSlots {
    /** A node's content, in place of its label. */
    default?: (props: TreeNodeSlotProps) => unknown;
    togglericon?: (props: { node: TreeNodeLike; expanded: boolean }) => unknown;
    empty?: () => unknown;
}

import { normalizeText } from './filter';
import { sortData, type SortMeta } from './sort';
import { getField } from '../utils/object';

export interface TreeNode<T = unknown> {
    key: string;
    label?: string;
    data?: T;
    icon?: string;
    children?: TreeNode<T>[];
    /** Forces a node to render as a leaf (or, with `false`, as expandable before its children load). */
    leaf?: boolean;
    selectable?: boolean;
    disabled?: boolean;
    [extra: string]: unknown;
}

export type ExpandedKeys = Record<string, boolean>;

/** Checkbox selection: a node is checked, partially checked (some descendants are), or absent. */
export type CheckState = Record<string, { checked: boolean; partialChecked: boolean }>;

export interface FlatNode<T = unknown> {
    node: TreeNode<T>;
    level: number;
    parent: TreeNode<T> | null;
    /** 1-based position among siblings, and the sibling count: `aria-posinset` and `aria-setsize`. */
    posInSet: number;
    setSize: number;
    expanded: boolean;
    leaf: boolean;
}

export function isLeaf(node: TreeNode): boolean {
    return node.leaf ?? !(node.children && node.children.length > 0);
}

/** The nodes a reader can see, in order, with what ARIA needs to describe each: the tree as a keyboard walks it. */
export function flattenTree<T>(nodes: readonly TreeNode<T>[], expandedKeys: ExpandedKeys, level = 1, parent: TreeNode<T> | null = null): FlatNode<T>[] {
    const out: FlatNode<T>[] = [];
    nodes.forEach((node, index) => {
        const leaf = isLeaf(node);
        const expanded = !leaf && !!expandedKeys[node.key];
        out.push({ node, level, parent, posInSet: index + 1, setSize: nodes.length, expanded, leaf });
        if (expanded && node.children) out.push(...flattenTree(node.children, expandedKeys, level + 1, node));
    });
    return out;
}

export function collectKeys(nodes: readonly TreeNode[], onlyBranches = true): string[] {
    const keys: string[] = [];
    const walk = (list: readonly TreeNode[]) =>
        list.forEach((node) => {
            if (!onlyBranches || !isLeaf(node)) keys.push(node.key);
            if (node.children) walk(node.children);
        });
    walk(nodes);
    return keys;
}

/** The ancestors of `key`, root first; empty when the node is at the top or absent. */
export function pathTo(nodes: readonly TreeNode[], key: string): TreeNode[] {
    for (const node of nodes) {
        if (node.key === key) return [];
        if (node.children) {
            const sub = pathTo(node.children, key);
            if (sub.length > 0 || node.children.some((c) => c.key === key)) return [node, ...sub];
        }
    }
    return [];
}

/**
 * Checks or unchecks `node` and everything beneath it, then recomputes every
 * ancestor: checked when all its children are, partial when some are. Returns a
 * new state; the one passed in is not touched.
 */
export function setChecked(nodes: readonly TreeNode[], state: CheckState, node: TreeNode, checked: boolean): CheckState {
    const next: CheckState = { ...state };
    const mark = (n: TreeNode) => {
        if (checked) next[n.key] = { checked: true, partialChecked: false };
        else delete next[n.key];
        n.children?.forEach(mark);
    };
    mark(node);
    for (const ancestor of pathTo(nodes, node.key).reverse()) {
        const children = ancestor.children ?? [];
        const all = children.every((c) => next[c.key]?.checked);
        const some = children.some((c) => next[c.key]?.checked || next[c.key]?.partialChecked);
        if (all) next[ancestor.key] = { checked: true, partialChecked: false };
        else if (some) next[ancestor.key] = { checked: false, partialChecked: true };
        else delete next[ancestor.key];
    }
    return next;
}

/**
 * Keeps the nodes whose fields match `query` and the branches leading to them.
 * Returns the pruned tree and the keys to expand so every match is visible.
 */
export function filterTree<T>(nodes: readonly TreeNode<T>[], query: string, fields: string[] = ['label'], locale?: string): { nodes: TreeNode<T>[]; expandedKeys: ExpandedKeys } {
    const needle = normalizeText(query, locale).trim();
    const expandedKeys: ExpandedKeys = {};
    if (!needle) return { nodes: [...nodes], expandedKeys };
    const walk = (list: readonly TreeNode<T>[]): TreeNode<T>[] =>
        list.flatMap((node): TreeNode<T>[] => {
            const hit = fields.some((f) => {
                const v = getField(node, f);
                return v != null && normalizeText(v, locale).includes(needle);
            });
            const children = node.children ? walk(node.children) : [];
            if (children.length > 0) {
                expandedKeys[node.key] = true;
                return [{ ...node, children }];
            }
            return hit ? [{ ...node, children: node.children ? [] : undefined }] : [];
        });
    return { nodes: walk(nodes), expandedKeys };
}

/**
 * The tree with every level sorted by `sorts`, whose fields are read from each
 * node (`data.name` for a node's data). Siblings are sorted among themselves;
 * the nesting is kept.
 */
export function sortTree<T>(nodes: readonly TreeNode<T>[], sorts: readonly SortMeta[], locale?: string): TreeNode<T>[] {
    if (sorts.length === 0) return [...nodes];
    return sortData(nodes, sorts, locale).map((node) => (node.children ? { ...node, children: sortTree(node.children, sorts, locale) } : node));
}

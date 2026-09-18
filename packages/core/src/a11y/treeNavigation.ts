import type { FlatNode } from '../data/tree';

/** What a key press on a tree item asks for; the component carries it out. */
export type TreeKeyAction =
    | { type: 'focus'; index: number }
    | { type: 'expand'; key: string }
    | { type: 'collapse'; key: string }
    | { type: 'expandAll'; keys: string[] }
    | { type: 'none' };

const none: TreeKeyAction = { type: 'none' };
const focus = (index: number): TreeKeyAction => ({ type: 'focus', index });

/** The index of the nearest node above `index` one level up, or -1 at the top. */
export function parentIndex(flat: readonly FlatNode[], index: number): number {
    const level = flat[index]?.level ?? 1;
    for (let i = index - 1; i >= 0; i--) if (flat[i]!.level < level) return i;
    return -1;
}

/**
 * The WAI-ARIA tree view keys over the visible nodes (`flattenTree`'s output):
 * Up/Down step, Home/End jump, Right expands a closed branch or enters an open
 * one, Left collapses an open branch or goes to the parent, and `*` expands
 * every sibling branch. Selection keys (Enter, Space) and typeahead are left to
 * the caller, which knows its selection mode.
 */
export function treeKeyAction(flat: readonly FlatNode[], index: number, key: string): TreeKeyAction {
    const current = flat[index];
    if (!current) return flat.length > 0 ? focus(0) : none;
    switch (key) {
        case 'ArrowDown':
            return index < flat.length - 1 ? focus(index + 1) : none;
        case 'ArrowUp':
            return index > 0 ? focus(index - 1) : none;
        case 'Home':
            return focus(0);
        case 'End':
            return focus(flat.length - 1);
        case 'ArrowRight':
            if (current.leaf) return none;
            if (!current.expanded) return { type: 'expand', key: current.node.key };
            return flat[index + 1]?.level === current.level + 1 ? focus(index + 1) : none;
        case 'ArrowLeft': {
            if (current.expanded) return { type: 'collapse', key: current.node.key };
            const parent = parentIndex(flat, index);
            return parent >= 0 ? focus(parent) : none;
        }
        case '*': {
            const keys = flat.filter((f) => f.parent === current.parent && !f.leaf && !f.expanded).map((f) => f.node.key);
            return keys.length > 0 ? { type: 'expandAll', keys } : none;
        }
        default:
            return none;
    }
}

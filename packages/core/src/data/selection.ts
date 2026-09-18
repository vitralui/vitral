import { equals } from '../utils/object';

export type SelectionMode = 'single' | 'multiple';

export function isSelected(selection: unknown, item: unknown, mode: SelectionMode, dataKey?: string): boolean {
    if (selection === null || selection === undefined) return false;
    if (mode === 'multiple') return Array.isArray(selection) && selection.some((s) => equals(s, item, dataKey));
    return equals(selection, item, dataKey);
}

/** The selection after toggling `item`; single mode deselects when it is already the choice. */
export function toggleSelection(selection: unknown, item: unknown, mode: SelectionMode, dataKey?: string): unknown {
    if (mode === 'multiple') {
        const list = Array.isArray(selection) ? selection : [];
        return isSelected(list, item, mode, dataKey) ? list.filter((s) => !equals(s, item, dataKey)) : [...list, item];
    }
    return isSelected(selection, item, mode, dataKey) ? null : item;
}

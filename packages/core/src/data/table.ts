import { equals } from '../utils/object';
import { isSelected } from './selection';
import type { SortMeta, SortOrder } from './sort';

export interface SortToggleOptions {
    /** Several columns may sort at once. */
    multiple?: boolean;
    /** This activation adds to the sort instead of replacing it — a Ctrl- or Cmd-click. */
    additive?: boolean;
    /** A third activation takes the column out of the sort instead of going back to ascending. */
    removable?: boolean;
}

/** The order a column sorts in, or 0 when it is not in the sort. */
export function sortOrderOf(sorts: readonly SortMeta[] | null | undefined, field: string): SortOrder | 0 {
    return sorts?.find((s) => s.field === field)?.order ?? 0;
}

/**
 * The sort after a column header is activated. The column cycles ascending →
 * descending → (unsorted, when removable) → ascending. A plain activation sorts
 * by that column alone; an additive one, in multiple mode, keeps the other
 * columns and their priority, appending the column when it is new.
 */
export function toggleSort(current: readonly SortMeta[], field: string, options: SortToggleOptions = {}): SortMeta[] {
    const existing = sortOrderOf(current, field);
    const order: SortOrder | 0 = existing === 0 ? 1 : existing === 1 ? -1 : options.removable ? 0 : 1;
    if (options.multiple && options.additive) {
        if (order === 0) return current.filter((s) => s.field !== field);
        if (existing !== 0) return current.map((s) => (s.field === field ? { field, order } : s));
        return [...current, { field, order }];
    }
    return order === 0 ? [] : [{ field, order }];
}

export type CheckAllState = 'all' | 'some' | 'none';

/** How much of `rows` the selection covers — what a select-all checkbox shows: checked, mixed or clear. */
export function selectionState(rows: readonly unknown[], selection: unknown, dataKey?: string): CheckAllState {
    if (rows.length === 0) return 'none';
    let count = 0;
    for (const row of rows) if (isSelected(selection, row, 'multiple', dataKey)) count++;
    return count === 0 ? 'none' : count === rows.length ? 'all' : 'some';
}

/**
 * The selection with `rows` added (or removed). Rows selected elsewhere — on
 * another page, or hidden by a filter — stay as they were.
 */
export function selectRows(selection: unknown, rows: readonly unknown[], select: boolean, dataKey?: string): unknown[] {
    const list = Array.isArray(selection) ? selection : [];
    if (select) return [...list, ...rows.filter((row) => !isSelected(list, row, 'multiple', dataKey))];
    return list.filter((item) => !rows.some((row) => equals(item, row, dataKey)));
}

/** The indices from `from` to `to`, inclusive, in either direction — a Shift-click or Shift+Space range. */
export function indexRange(from: number, to: number): number[] {
    const low = Math.min(from, to);
    const high = Math.max(from, to);
    return Array.from({ length: high - low + 1 }, (_, i) => low + i);
}

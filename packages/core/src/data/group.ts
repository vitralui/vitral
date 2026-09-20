import { getField } from '../utils/object';

/**
 * Rows gathered by what they have in common, for a table that shows its runs
 * with a heading over each.
 *
 * They are gathered by value rather than by adjacency, so grouping survives a
 * sort on some other column: ordering by name while grouped by team keeps the
 * teams together and sorts within them, which is what a reader means by both
 * at once. Groups keep the order their first row appeared in, so the sort the
 * reader chose still decides which group leads.
 */

export interface RowGroup<T = unknown> {
    /** The value every row in the group shares, as it came off the field. */
    value: unknown;
    /** A stable key for collapsing, since the value may be a number, a date or null. */
    key: string;
    rows: T[];
}

/** A key a value can be looked up by, including the two that are not values. */
export const groupKeyOf = (value: unknown): string => (value === null ? '\u0000null' : value === undefined ? '\u0000none' : value instanceof Date ? `\u0000date:${value.getTime()}` : String(value));

/** The rows gathered by `field`, each group in the order its first row appeared. */
export function groupRows<T>(rows: readonly T[], field: string): RowGroup<T>[] {
    const groups: RowGroup<T>[] = [];
    const byKey = new Map<string, RowGroup<T>>();
    for (const row of rows) {
        const value = getField(row, field);
        const key = groupKeyOf(value);
        let group = byKey.get(key);
        if (!group) {
            group = { value, key, rows: [] };
            byKey.set(key, group);
            groups.push(group);
        }
        group.rows.push(row);
    }
    return groups;
}

/** One line of a grouped table: a heading, or a row under the heading before it. */
export type GroupedRow<T = unknown> =
    | { kind: 'group'; group: RowGroup<T>; /** Its place among the groups, for `aria-posinset`. */ index: number; collapsed: boolean }
    | { kind: 'row'; row: T; /** Its place in the ungrouped list, which is the index the table reports. */ index: number };

/**
 * The groups flattened back into the lines a table draws, with the rows of a
 * collapsed group left out. A row keeps the index it had before grouping: it
 * is the row's identity to everything else — selection, the keyboard, an event
 * — and shuffling it about because a heading was inserted would break all three.
 */
export function flattenGroups<T>(groups: readonly RowGroup<T>[], rows: readonly T[], collapsed: ReadonlySet<string>): GroupedRow<T>[] {
    const indexOf = new Map<T, number>();
    rows.forEach((row, index) => {
        if (!indexOf.has(row)) indexOf.set(row, index);
    });
    const out: GroupedRow<T>[] = [];
    groups.forEach((group, index) => {
        const shut = collapsed.has(group.key);
        out.push({ kind: 'group', group, index, collapsed: shut });
        if (shut) return;
        for (const row of group.rows) out.push({ kind: 'row', row, index: indexOf.get(row) ?? 0 });
    });
    return out;
}

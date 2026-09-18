import { getField } from '../utils/object';

export type SortOrder = 1 | -1;

export interface SortMeta {
    field: string;
    order: SortOrder;
}

/** Natural order: strings compare by locale with numbers read as numbers, so "Item 10" follows "Item 9". */
export function compareValues(a: unknown, b: unknown, locale?: string): number {
    if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b, locale, { numeric: true, sensitivity: 'base' });
    if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
    if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
    const x = a as number;
    const y = b as number;
    return x < y ? -1 : x > y ? 1 : 0;
}

/**
 * Sorts by each field in turn. The sort is stable and empty values go last in
 * both directions — flipping a column to descending should not bring every
 * blank cell to the top.
 */
export function sortData<T>(data: readonly T[], sorts: readonly SortMeta[], locale?: string): T[] {
    if (sorts.length === 0) return [...data];
    return data
        .map((item, index) => ({ item, index }))
        .sort((x, y) => {
            for (const { field, order } of sorts) {
                const a = getField(x.item, field);
                const b = getField(y.item, field);
                const aEmpty = a === null || a === undefined || a === '';
                const bEmpty = b === null || b === undefined || b === '';
                if (aEmpty || bEmpty) {
                    if (aEmpty && bEmpty) continue;
                    return aEmpty ? 1 : -1;
                }
                const result = compareValues(a, b, locale);
                if (result !== 0) return result * order;
            }
            return x.index - y.index;
        })
        .map((entry) => entry.item);
}

import { getField } from '../utils/object';

export type SortOrder = 1 | -1;

export interface SortMeta {
    field: string;
    order: SortOrder;
}

// One collator a locale. `localeCompare` with options builds a new one on
// every call, which a sort of many rows makes a hundred thousand times over.
const collators = new Map<string, Intl.Collator>();
const collatorFor = (locale?: string) => {
    const key = locale ?? '';
    let collator = collators.get(key);
    if (!collator) collators.set(key, (collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' })));
    return collator;
};

/** Natural order: strings compare by locale with numbers read as numbers, so "Item 10" follows "Item 9". */
export function compareValues(a: unknown, b: unknown, locale?: string): number {
    if (typeof a === 'string' && typeof b === 'string') return collatorFor(locale).compare(a, b);
    if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
    if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
    const x = a as number;
    const y = b as number;
    return x < y ? -1 : x > y ? 1 : 0;
}

/**
 * A column whose values are all text (or empty) as numbers that sort the same
 * way: its distinct values put in order once — a handful for a city or a
 * status, however many rows — and each given its place, the same place for
 * two the collator holds equal. Any other column, or one of mostly distinct
 * text, comes back as it is.
 */
function ranked(values: unknown[], collator: Intl.Collator): unknown[] {
    const distinct = new Set<string>();
    for (const value of values) {
        if (typeof value === 'string') {
            if (value !== '') distinct.add(value);
        } else if (value !== null && value !== undefined) return values;
    }
    // Most values distinct (names, codes): ranking them costs more than it saves.
    if (distinct.size > values.length / 2) return values;
    const order = [...distinct].sort(collator.compare);
    const rank = new Map<string, number>();
    order.forEach((value, at) => rank.set(value, at > 0 && collator.compare(order[at - 1]!, value) === 0 ? rank.get(order[at - 1]!)! : at));
    return values.map((value) => (typeof value === 'string' && value !== '' ? rank.get(value) : value));
}

/**
 * Sorts by each field in turn. The sort is stable and empty values go last in
 * both directions, since flipping a column to descending should not bring every
 * blank cell to the top.
 */
export function sortData<T>(
    data: readonly T[],
    sorts: readonly SortMeta[],
    locale?: string,
    /** How a field is read, and the fields with an order of their own; see `LoadOptions`. */
    options: { getValue?: (item: unknown, field: string) => unknown; comparators?: Record<string, (a: unknown, b: unknown) => number> } = {}
): T[] {
    if (sorts.length === 0) return [...data];
    const collator = collatorFor(locale);
    const read = options.getValue ?? getField;
    const own = sorts.map(({ field }) => options.comparators?.[field]);
    // Each field read once a row, before the sort, rather than twice a comparison;
    // a column of text turned into ranks, so the rows compare numbers — unless it has an order of its own.
    const keys = sorts.map(({ field }, at) => {
        const values = data.map((item) => read(item, field));
        return own[at] ? values : ranked(values, collator);
    });
    const orders = sorts.map(({ order }) => order);
    return data
        .map((_, index) => index)
        .sort((x, y) => {
            for (let at = 0; at < keys.length; at++) {
                const a = keys[at]![x];
                const b = keys[at]![y];
                const aEmpty = a === null || a === undefined || a === '';
                const bEmpty = b === null || b === undefined || b === '';
                if (aEmpty || bEmpty) {
                    if (aEmpty && bEmpty) continue;
                    return aEmpty ? 1 : -1;
                }
                const compare = own[at];
                const result = compare ? compare(a, b) : typeof a === 'string' && typeof b === 'string' ? collator.compare(a, b) : compareValues(a, b, locale);
                if (result !== 0) return result * orders[at]!;
            }
            return x - y;
        })
        .map((index) => data[index]!);
}

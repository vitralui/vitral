import { equals } from '../utils/object';

export const FilterMatchMode = {
    STARTS_WITH: 'startsWith',
    CONTAINS: 'contains',
    NOT_CONTAINS: 'notContains',
    ENDS_WITH: 'endsWith',
    EQUALS: 'equals',
    NOT_EQUALS: 'notEquals',
    IN: 'in',
    LESS_THAN: 'lt',
    LESS_THAN_OR_EQUAL_TO: 'lte',
    GREATER_THAN: 'gt',
    GREATER_THAN_OR_EQUAL_TO: 'gte',
    BETWEEN: 'between',
    DATE_IS: 'dateIs',
    DATE_IS_NOT: 'dateIsNot',
    DATE_BEFORE: 'dateBefore',
    DATE_AFTER: 'dateAfter'
} as const;

export type FilterMatchModeValue = (typeof FilterMatchMode)[keyof typeof FilterMatchMode];

export type FilterFn = (value: unknown, filter: unknown, locale?: string) => boolean;

/**
 * Case- and accent-insensitive text, so "sao paulo" finds "São Paulo". Filtering
 * that tripped over diacritics would be unusable in Portuguese, Spanish or French.
 */
export function normalizeText(value: unknown, locale?: string): string {
    return String(value)
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLocaleLowerCase(locale);
}

/** An empty filter matches everything: a cleared search box must not hide the table. */
export function isBlankFilter(filter: unknown): boolean {
    return filter === undefined || filter === null || (typeof filter === 'string' && filter.trim() === '') || (Array.isArray(filter) && filter.length === 0);
}

const comparable = (value: unknown): unknown => (value instanceof Date ? value.getTime() : value);

const sameDay = (a: unknown, b: unknown) => a instanceof Date && b instanceof Date && a.toDateString() === b.toDateString();

const text = (test: (value: string, filter: string) => boolean): FilterFn => (value, filter, locale) => {
    if (isBlankFilter(filter)) return true;
    if (value === undefined || value === null) return false;
    return test(normalizeText(value, locale), normalizeText(filter, locale));
};

const order = (test: (value: number, filter: number) => boolean): FilterFn => (value, filter) => {
    if (isBlankFilter(filter)) return true;
    if (value === undefined || value === null) return false;
    return test(comparable(value) as number, comparable(filter) as number);
};

const equalTo: FilterFn = (value, filter, locale) => {
    if (isBlankFilter(filter)) return true;
    if (value === undefined || value === null) return false;
    if (value instanceof Date || filter instanceof Date) return comparable(value) === comparable(filter);
    return normalizeText(value, locale) === normalizeText(filter, locale);
};

const registry: Record<string, FilterFn> = {
    startsWith: text((v, f) => v.startsWith(f)),
    contains: text((v, f) => v.includes(f)),
    notContains: text((v, f) => !v.includes(f)),
    endsWith: text((v, f) => v.endsWith(f)),
    equals: equalTo,
    notEquals: (value, filter, locale) => isBlankFilter(filter) || !equalTo(value, filter, locale),
    in: (value, filter) => isBlankFilter(filter) || (filter as unknown[]).some((item) => equals(item, value)),
    lt: order((v, f) => v < f),
    lte: order((v, f) => v <= f),
    gt: order((v, f) => v > f),
    gte: order((v, f) => v >= f),
    between: (value, filter) => {
        if (!Array.isArray(filter) || (filter[0] == null && filter[1] == null)) return true;
        if (value === undefined || value === null) return false;
        const v = comparable(value) as number;
        const [low, high] = filter.map(comparable) as [number | null, number | null];
        return (low == null || v >= low) && (high == null || v <= high);
    },
    dateIs: (value, filter) => isBlankFilter(filter) || sameDay(value, filter),
    dateIsNot: (value, filter) => isBlankFilter(filter) || !sameDay(value, filter),
    dateBefore: order((v, f) => v < f),
    dateAfter: order((v, f) => v > f)
};

export const FilterService = {
    /** Adds or replaces a match mode, e.g. a fuzzy matcher, for every component that filters. */
    register(name: string, fn: FilterFn): void {
        registry[name] = fn;
    },
    get(name: string): FilterFn | undefined {
        return registry[name];
    },
    matches(value: unknown, filter: unknown, mode: string = FilterMatchMode.CONTAINS, locale?: string): boolean {
        const fn = registry[mode];
        if (!fn) throw new Error(`[vitral] unknown filter match mode "${mode}"`);
        return fn(value, filter, locale);
    }
};

import { getField as readField } from '../utils/object';
import { FilterMatchMode, FilterService } from './filter';
import { sortData, type SortMeta } from './sort';

export interface FilterConstraint {
    value: unknown;
    matchMode?: string;
}

export interface CompositeFilter {
    operator: 'and' | 'or';
    constraints: FilterConstraint[];
}

/** Per-field filters, keyed by field path. */
export type FilterMeta = Record<string, FilterConstraint | CompositeFilter>;

export interface GlobalFilter {
    value: unknown;
    fields: string[];
    matchMode?: string;
}

/**
 * Everything a data component asks of its data: which page, in what order,
 * narrowed how. The same object is what a lazy table hands a server, so local
 * and remote data answer one question.
 */
export interface LoadOptions {
    first?: number;
    rows?: number;
    sort?: SortMeta[];
    filters?: FilterMeta;
    globalFilter?: GlobalFilter;
    locale?: string;
    /** How a field's value is read from an item: its dotted path, by default. A worked-out column reads its own way. */
    getValue?: (item: unknown, field: string) => unknown;
    /** An order of their own for some fields, by field: a comparison of two values, as `Array.sort` takes. */
    comparators?: Record<string, (a: unknown, b: unknown) => number>;
}

export interface LoadResult<T> {
    items: T[];
    /** Rows matching the filters before paging, which is what a paginator counts. */
    total: number;
}

const isComposite = (filter: FilterConstraint | CompositeFilter): filter is CompositeFilter => 'constraints' in filter;

export function filterData<T>(data: readonly T[], options: Pick<LoadOptions, 'filters' | 'globalFilter' | 'locale' | 'getValue'>): T[] {
    const { filters = {}, globalFilter, locale } = options;
    const getField = options.getValue ?? readField;
    const fields = Object.keys(filters);
    return data.filter((item) => {
        for (const field of fields) {
            const filter = filters[field]!;
            const value = getField(item, field);
            if (isComposite(filter)) {
                const results = filter.constraints.map((c) => FilterService.matches(value, c.value, c.matchMode ?? FilterMatchMode.STARTS_WITH, locale));
                const ok = filter.operator === 'or' ? results.some(Boolean) || results.length === 0 : results.every(Boolean);
                if (!ok) return false;
            } else if (!FilterService.matches(value, filter.value, filter.matchMode ?? FilterMatchMode.STARTS_WITH, locale)) {
                return false;
            }
        }
        if (globalFilter && globalFilter.fields.length > 0) {
            const mode = globalFilter.matchMode ?? FilterMatchMode.CONTAINS;
            return globalFilter.fields.some((field) => FilterService.matches(getField(item, field), globalFilter.value, mode, locale));
        }
        return true;
    });
}

/** Filters, sorts, then pages: the order a server would do it in, so a lazy table and a local one agree. */
export function queryData<T>(data: readonly T[], options: LoadOptions = {}): LoadResult<T> {
    let rows = filterData(data, options);
    rows = sortData(rows, options.sort ?? [], options.locale, options);
    const total = rows.length;
    if (options.rows != null && options.rows > 0) {
        const first = Math.max(0, options.first ?? 0);
        rows = rows.slice(first, first + options.rows);
    }
    return { items: rows, total };
}

import { getField, type CompositeFilter, type FilterConstraint, type FilterMeta, type Locale } from '@vitral/core';
import { editorKind, editorText, parseEdit, readValue } from './edit';
import type { DataGridColumn } from './types';

/**
 * What a column's filter panel works with, with the DOM left out: the kind of
 * values a column holds, the ways a condition on them may compare, the
 * conditions as the panel shows them, and the values a list filter offers.
 */

export type FilterKind = 'text' | 'number' | 'date' | 'set';

const MODES: Record<Exclude<FilterKind, 'set'>, string[]> = {
    text: ['contains', 'notContains', 'startsWith', 'endsWith', 'equals', 'notEquals'],
    number: ['equals', 'notEquals', 'lt', 'lte', 'gt', 'gte'],
    date: ['dateIs', 'dateIsNot', 'dateBefore', 'dateAfter', 'dateBetween']
};

/** The kind a column filters as: what it says, or the kind of the first value it holds. */
export function filterKind<T>(column: DataGridColumn<T>, rows: readonly T[], field: string): FilterKind {
    if (typeof column.filter === 'string') return column.filter;
    // A list of values to choose from is a list filter: nothing else would use it.
    if (column.filterOptions) return 'set';
    const sample = rows.map((row) => readValue(column, row, field)).find((value) => value !== null && value !== undefined && value !== '');
    const kind = editorKind(sample);
    return kind === 'number' || kind === 'date' ? kind : 'text';
}

/** The ways a condition may compare: the column's own list, or its kind's. */
export const matchModesFor = <T,>(column: DataGridColumn<T>, kind: FilterKind): string[] => (kind === 'set' ? ['anyOf'] : (column.filterMatchModes ?? MODES[kind]));

/** A column's filter as the panel shows it: two conditions joined by an operator, the second maybe empty. */
export interface PanelFilter {
    operator: 'and' | 'or';
    constraints: [FilterConstraint, FilterConstraint];
}

export function panelFilter(filter: FilterMeta[string] | undefined, modes: string[]): PanelFilter {
    const first = modes[0] ?? 'contains';
    const blank = (): FilterConstraint => ({ value: null, matchMode: first });
    if (!filter) return { operator: 'and', constraints: [blank(), blank()] };
    if ('constraints' in filter) {
        const [a, b] = filter.constraints;
        return { operator: filter.operator, constraints: [{ ...blank(), ...a }, { ...blank(), ...b }] };
    }
    return { operator: 'and', constraints: [{ ...blank(), ...filter }, blank()] };
}

/** The panel's conditions as the filter the grid keeps: the second left out while it has no value. */
export function fromPanel(panel: PanelFilter): CompositeFilter {
    const [a, b] = panel.constraints;
    const used = b.value === null || b.value === undefined || b.value === '' ? [a] : [a, b];
    return { operator: panel.operator, constraints: used.map((constraint) => ({ ...constraint })) };
}

/** A condition that takes two values, from and to, kept in its box as both with this between. */
export const isSpanMode = (mode: string | undefined): boolean => mode === 'dateBetween';
const SPAN = '/';

/** What a condition's box shows for its value, and what it reads back: a number in the reader's decimals, a date as a date input has it, a span as its two ends. */
export const filterText = (value: unknown, locale?: string): string =>
    Array.isArray(value) ? `${editorText(value[0], locale)}${SPAN}${editorText(value[1], locale)}` : editorText(value, locale);

/** The two ends of a span's text; a text of one value is the start. */
export const spanTexts = (text: string): [string, string] => {
    const [start = '', end = ''] = text.split(SPAN);
    return [start, end];
};

/** The text of a span from its two ends' texts. */
export const spanText = (start: string, end: string): string => (start || end ? `${start}${SPAN}${end}` : '');

export function filterValue(text: string, kind: FilterKind, locale: Locale, mode?: string): unknown {
    if (!text.trim()) return null;
    if (isSpanMode(mode)) {
        const [start, end] = spanTexts(text).map((part) => filterValue(part, kind, locale)) as [unknown, unknown];
        return start === null && end === null ? null : [start, end];
    }
    if (kind === 'number' || kind === 'date') {
        const result = parseEdit(text, kind === 'number' ? 0 : new Date(), { field: '' }, {}, locale);
        // Text that is no number yet (a minus sign on its own) filters nothing until it is one.
        return 'value' in result ? result.value : null;
    }
    return text;
}

/** An option given with the words it is shown by. */
export const labelled = (option: unknown): option is { label: string; value: unknown } =>
    !!option && typeof option === 'object' && !(option instanceof Date) && 'value' in option && typeof (option as { label?: unknown }).label === 'string';

/** The words a list filter gives a value: its option's label, the column's own `filterLabel`, or none, which leaves it to the grid. */
export function optionLabel<T>(column: DataGridColumn<T>, value: unknown): string | undefined {
    const option = column.filterOptions?.find((entry) => labelled(entry) && entry.value === value) as { label: string } | undefined;
    return option?.label ?? column.filterLabel?.(value) ?? (value === null || value === undefined ? undefined : column.valueFormatter?.(value));
}

/**
 * The values a list filter offers: the column's own list, or every value in
 * the rows, once each, in order, with blanks as one `null` at the end.
 */
export function distinctValues<T>(column: DataGridColumn<T>, rows: readonly T[], field: string, locale?: string): unknown[] {
    if (column.filterOptions) return column.filterOptions.map((option) => (labelled(option) ? option.value : option));
    const seen = new Map<string, unknown>();
    let blank = false;
    for (const row of rows) {
        const value = readValue(column, row, field);
        if (value === null || value === undefined || value === '') {
            blank = true;
            continue;
        }
        const key = value instanceof Date ? `d${value.getTime()}` : `${typeof value}:${String(value)}`;
        if (!seen.has(key)) seen.set(key, value);
    }
    const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
    const values = [...seen.values()].sort((a, b) =>
        typeof a === 'number' && typeof b === 'number' ? a - b : a instanceof Date && b instanceof Date ? a.getTime() - b.getTime() : collator.compare(String(a), String(b))
    );
    return blank ? [...values, null] : values;
}

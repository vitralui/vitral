import { getField, setField, type Locale } from '@vitral/core';
import type { DataGridColumn, Row } from './types';

/**
 * What editing a cell comes to, with the DOM left out: whether a cell can be
 * edited, what kind of box its value is typed into, how the text read back
 * becomes a value, and the list of edits that undo walks back through.
 */

/** Whether the reader may change this column's cell in this row. */
export function isEditable<T>(column: DataGridColumn<T>, row: T): boolean {
    const { editable } = column;
    if (!editable || column.selectionMode || column.expander) return false;
    if (!column.field && !column.setValue) return false;
    return typeof editable === 'function' ? editable(row) : true;
}

/** The kind of box a value is typed into: the kind of value the cell held. */
export type EditorKind = 'text' | 'number' | 'date' | 'checkbox';

export function editorKind(value: unknown): EditorKind {
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    if (typeof value === 'boolean') return 'checkbox';
    return 'text';
}

/** The decimal separator a language writes. */
const decimalOf = (locale?: string): string => (1.5).toLocaleString(locale).replace(/\d/g, '').charAt(0) || '.';

const pad = (n: number) => String(n).padStart(2, '0');

/** A value as the text its box starts with: a number in the reader's own decimals, a date as a date input reads it. */
export function editorText(value: unknown, locale?: string): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString(locale, { useGrouping: false, maximumFractionDigits: 20 }) : '';
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
    return String(value);
}

/**
 * The text read back as a value of the kind the cell held: a number in the
 * reader's decimals (with or without the thousands between), a date as a date
 * input gives it, anything else as typed. Text that is no such thing is
 * refused with the reason; an empty box is no value.
 */
export function parseEdit<T>(input: unknown, previous: unknown, column: DataGridColumn<T>, row: T, locale: Locale): { value: unknown } | { error: string } {
    if (typeof input !== 'string') return { value: input };
    if (column.parseValue) return { value: column.parseValue(input, row) };
    const text = input.trim();
    switch (editorKind(previous)) {
        case 'number': {
            if (!text) return { value: null };
            const decimal = decimalOf(locale.code);
            const group = decimal === ',' ? '.' : ',';
            const plain = text.replace(/[\s  ]/g, '').split(group).join('').replace(decimal, '.');
            const value = Number(plain);
            return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(plain) && Number.isFinite(value) ? { value } : { error: locale.datagrid.notANumber };
        }
        case 'date': {
            if (!text) return { value: null };
            const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
            const value = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(Number.NaN);
            return Number.isNaN(value.getTime()) ? { error: locale.datagrid.notADate } : { value };
        }
        default:
            return { value: input };
    }
}

/** Why a value is refused, or nothing when the column lets it through. */
export function validateEdit<T>(value: unknown, column: DataGridColumn<T>, row: T): string | undefined {
    const verdict = column.validate?.(value, row);
    return typeof verdict === 'string' && verdict ? verdict : undefined;
}

/** What a cell holds, as the column reads it. */
export const cellValue = <T,>(column: DataGridColumn<T>, row: T): unknown => readValue(column, row, column.field);

/** A column's value in a row: what its `valueGetter` works out, or what is at the field. */
export const readValue = <T,>(column: DataGridColumn<T>, row: T, field?: string): unknown => (column.valueGetter ? column.valueGetter(row) : field ? getField(row, field) : undefined);

/** Writes a kept value into the row: through the column's own setter, or at its field. */
export function writeCell<T>(column: DataGridColumn<T>, row: T, value: unknown): void {
    if (column.setValue) column.setValue(row, value);
    else if (column.field) setField(row, column.field, value);
}

/** One edit: a cell of a row that held `value` and holds `newValue`. */
export interface EditRecord<T = Row> {
    row: T;
    key: string;
    column: DataGridColumn<T>;
    value: unknown;
    newValue: unknown;
}

/**
 * The edits made so far, as steps undo walks back through and redo walks
 * forward again; a step is every cell one save changed. A new edit after an
 * undo drops what could have been done again, as an editor does.
 */
export function createEditHistory<T = Row>(limit = 100) {
    let steps: EditRecord<T>[][] = [];
    let at = 0;
    return {
        push(step: EditRecord<T>[]) {
            if (!step.length) return;
            steps = [...steps.slice(0, at), step].slice(-limit);
            at = steps.length;
        },
        /** The step to undo, which is then behind the reader. */
        undo(): EditRecord<T>[] | undefined {
            if (at === 0) return undefined;
            return steps[--at];
        },
        redo(): EditRecord<T>[] | undefined {
            if (at >= steps.length) return undefined;
            return steps[at++];
        },
        canUndo: () => at > 0,
        canRedo: () => at < steps.length,
        clear() {
            steps = [];
            at = 0;
        }
    };
}

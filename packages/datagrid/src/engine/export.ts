import { getField } from '@vitral/core';
import type { ResolvedColumn } from './state';
import type { Row } from './types';

/** How a table is written out as CSV. */
export interface DataGridCsvOptions {
    /** Between values. Defaults to `,`; `;` is what a spreadsheet in a comma-decimal locale expects. */
    separator?: string;
    /** Write the column headings first. Defaults to true. */
    header?: boolean;
    /** Defaults to `\r\n`, which is what RFC 4180 and every spreadsheet read. */
    lineEnding?: '\n' | '\r\n';
    /**
     * Put a `'` before a value that starts with `=`, `+`, `-`, `@`, a tab or a
     * return, so a spreadsheet opening the file shows it rather than runs it.
     * Defaults to true; a number is never touched.
     */
    sanitize?: boolean;
    /** Which columns, by key; every exportable column on show otherwise. */
    columns?: string[];
}

const DANGEROUS = /^[=+\-@\t\r]/;

/** One value as a CSV field: quoted when it has to be, its quotes doubled. */
export function csvField(value: unknown, separator = ',', sanitize = true): string {
    if (value === null || value === undefined) return '';
    let text: string;
    if (value instanceof Date) text = Number.isNaN(value.getTime()) ? '' : value.toISOString();
    else if (typeof value === 'object') text = JSON.stringify(value);
    else text = String(value);
    if (sanitize && typeof value === 'string' && DANGEROUS.test(text)) text = `'${text}`;
    return text.includes(separator) || /["\r\n]/.test(text) || text !== text.trim() ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The columns an export writes: those on show with something to write, never a selection column. */
export function exportColumns<T>(columns: readonly ResolvedColumn<T>[], keys?: readonly string[]): ResolvedColumn<T>[] {
    const wanted = columns.filter((c) => !c.selectionMode && c.column.exportable !== false && (c.field || c.column.exportValue));
    return keys ? keys.map((key) => wanted.find((c) => c.key === key)).filter((c): c is ResolvedColumn<T> => !!c) : wanted;
}

/** Rows as CSV, one line a row, in the columns' order. */
export function toCSV<T = Row>(rows: readonly T[], columns: readonly ResolvedColumn<T>[], options: DataGridCsvOptions = {}): string {
    const { separator = ',', header = true, lineEnding = '\r\n', sanitize = true } = options;
    const chosen = exportColumns(columns, options.columns);
    const lines: string[] = [];
    if (header) lines.push(chosen.map((c) => csvField(c.column.exportHeader ?? c.header, separator, sanitize)).join(separator));
    for (const row of rows) {
        lines.push(chosen.map((c) => csvField(c.column.exportValue ? c.column.exportValue(row) : getField(row, c.field), separator, sanitize)).join(separator));
    }
    return lines.join(lineEnding);
}

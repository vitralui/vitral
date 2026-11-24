/**
 * Cells marked as a block, with the DOM left out: the block between two
 * cells, the text a spreadsheet copies and pastes, a run of values carried on
 * by the fill handle, and what a block of numbers adds up to.
 */

/** A cell, by its row's index among the rows on show and its column's key. */
export interface CellRef {
    index: number;
    key: string;
}

/** The block between two cells: its rows in the order shown, and its columns in theirs. */
export interface RangeBox {
    rows: number[];
    keys: string[];
}

/** The block from `anchor` to `focus`, over the rows and columns as they are laid out. */
export function rangeBox(anchor: CellRef, focus: CellRef, rows: readonly number[], keys: readonly string[]): RangeBox | null {
    const r0 = rows.indexOf(anchor.index);
    const r1 = rows.indexOf(focus.index);
    const c0 = keys.indexOf(anchor.key);
    const c1 = keys.indexOf(focus.key);
    if (r0 < 0 || r1 < 0 || c0 < 0 || c1 < 0) return null;
    return { rows: rows.slice(Math.min(r0, r1), Math.max(r0, r1) + 1), keys: keys.slice(Math.min(c0, c1), Math.max(c0, c1) + 1) };
}

/**
 * Text as a spreadsheet pastes it: a line a row, a tab between cells, and a
 * cell in quotes when it holds a tab, a line break or a quote of its own.
 */
export function parseClipboard(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i]!;
        if (quoted) {
            if (char === '"' && text[i + 1] === '"') {
                cell += '"';
                i++;
            } else if (char === '"') quoted = false;
            else cell += char;
        } else if (char === '"' && cell === '') quoted = true;
        else if (char === '\t') {
            row.push(cell);
            cell = '';
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && text[i + 1] === '\n') i++;
            row.push(cell);
            rows.push(row);
            row = [];
            cell = '';
        } else cell += char;
    }
    if (cell !== '' || row.length) {
        row.push(cell);
        rows.push(row);
    }
    return rows;
}

/** Cells as text a spreadsheet pastes: the reverse of {@link parseClipboard}. */
export function toClipboard(rows: readonly (readonly string[])[]): string {
    const field = (text: string) => (/[\t\r\n"]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);
    return rows.map((row) => row.map(field).join('\t')).join('\r\n');
}

/**
 * The values the fill handle carries on with, `count` of them: numbers (or
 * dates) that step evenly go on stepping; anything else repeats, in turn.
 */
export function fillSeries(values: readonly unknown[], count: number): unknown[] {
    if (!values.length || count <= 0) return [];
    const numbers = values.every((value) => typeof value === 'number' && Number.isFinite(value));
    const dates = values.every((value) => value instanceof Date && !Number.isNaN(value.getTime()));
    if ((numbers || dates) && values.length > 1) {
        const points = values.map((value) => (value instanceof Date ? value.getTime() : (value as number)));
        const step = (points.at(-1)! - points[0]!) / (points.length - 1);
        const even = points.every((point, at) => Math.abs(point - (points[0]! + step * at)) < 1e-9 * Math.max(1, Math.abs(point)));
        if (even) {
            return Array.from({ length: count }, (_, at) => {
                const next = points.at(-1)! + step * (at + 1);
                // A sum of steps in floating point would show its error: 0.30000000000000004.
                return dates ? new Date(next) : Number(next.toPrecision(12));
            });
        }
    }
    return Array.from({ length: count }, (_, at) => values[at % values.length]);
}

/** What a block of cells adds up to: how many hold a value, and over the numbers among them. */
export function rangeStats(values: readonly unknown[]): { count: number; numbers: number; sum: number; avg: number; min: number; max: number } {
    const present = values.filter((value) => value !== null && value !== undefined && value !== '');
    const numbers = present.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    const sum = numbers.reduce((total, n) => total + n, 0);
    return {
        count: present.length,
        numbers: numbers.length,
        sum,
        avg: numbers.length ? sum / numbers.length : 0,
        min: numbers.length ? Math.min(...numbers) : 0,
        max: numbers.length ? Math.max(...numbers) : 0
    };
}

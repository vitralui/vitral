import { cellKey, columnLabel, fromKey, keyOf, normalizeRange, parseRange, parseRef, rangeCells, rangeColumns, rangeRows } from './a1';
import { dateFromSerial, numberFromText, serialFromParts } from './coerce';
import { createDependencies, referencesOf } from './deps';
import { evaluate, type EvalContext } from './evaluate';
import { formulaBody, offsetNode, parseFormula, printNode, type Node } from './parse';
import { errorValue, isError, isRangeValue, type Cell, type CellAddress, type CellFormat, type CellPatch, type CellRange, type RangeValue, type Scalar, type SheetEvents, type SheetOptions } from './types';

/**
 * The document: what is in every cell, what it works out to, and the history
 * of getting there. There is no DOM and no timer here — a sheet is a map of
 * addresses to what was typed, and everything else is worked out from it, so
 * the whole of it can be tested, saved as JSON and brought back the same.
 *
 * A value is worked out when it is asked for and kept until something it
 * reads changes; `deps.ts` says what that is, so an edit costs the cells that
 * followed from it rather than the sheet.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface Sheet {
    readonly rows: number;
    readonly columns: number;
    /** What was typed into a cell. */
    input(address: CellAddress): string;
    /** What it came to: a number, text, a boolean, an error, or nothing. */
    value(address: CellAddress): Scalar;
    /** What it reads as, formatted. */
    display(address: CellAddress): string;
    format(address: CellAddress): CellFormat | undefined;
    /** One edit, undone in one step. */
    setInput(address: CellAddress, input: string): void;
    /** Several, as one step: a paste, a fill, a delete over a rectangle. */
    setInputs(entries: { address: CellAddress; input: string }[]): void;
    setFormat(range: CellRange, format: CellFormat | null): void;
    clear(range: CellRange): void;
    /** The handle dragged from one rectangle over another: copies, or carries a series on. */
    fill(source: CellRange, target: CellRange): void;
    /** Tab-separated text put in at a corner, as a spreadsheet and a table both paste. */
    paste(anchor: CellAddress, text: string): void;
    /** A rectangle as tab-separated text: what it shows, or what was typed into it. */
    copyText(range: CellRange, options?: { formulas?: boolean }): string;
    undo(): boolean;
    redo(): boolean;
    canUndo(): boolean;
    canRedo(): boolean;
    /** The rectangle that holds everything in the sheet, or nothing where it is empty. */
    usedRange(): CellRange | null;
    /** The sheet as a plain object, keyed by A1: what to save. */
    toJSON(): Record<string, string>;
    /** Called after every change, with the cells that moved. */
    subscribe(listener: (event: { keys: string[]; source: 'edit' | 'undo' | 'redo' }) => void): () => void;
    resize(size: { rows?: number; columns?: number }): void;
}

export function createSheet(options: SheetOptions = {}, events: SheetEvents = {}): Sheet {
    const cells = new Map<string, Cell>();
    const values = new Map<string, Scalar>();
    const trees = new Map<string, Node | null>();
    const deps = createDependencies();
    const visiting = new Set<string>();
    const listeners = new Set<(event: { keys: string[]; source: 'edit' | 'undo' | 'redo' }) => void>();
    const undoStack: CellPatch[][] = [];
    const redoStack: CellPatch[][] = [];
    let rows = options.rows ?? 100;
    let columns = options.columns ?? 26;
    const now = () => options.now?.() ?? new Date();

    // ---- reading

    const context: EvalContext = {
        now,
        cell: (address) => valueAt(address),
        range(range) {
            const box = normalizeRange(range);
            const out: Scalar[] = [];
            for (const cell of rangeCells(box)) out.push(valueAt(cell));
            return { rows: rangeRows(box), cols: rangeColumns(box), values: out };
        }
    };

    /** What a cell holds when it is not a formula: a number, a date, a truth, text. */
    function literal(input: string): { value: Scalar; format?: CellFormat } {
        if (input === '') return { value: null };
        const upper = input.trim().toUpperCase();
        if (upper === 'TRUE') return { value: true };
        if (upper === 'FALSE') return { value: false };
        const iso = ISO_DATE.exec(input.trim());
        if (iso) return { value: serialFromParts(Number(iso[1]), Number(iso[2]), Number(iso[3])), format: { kind: 'date' } };
        const number = numberFromText(input);
        if (number === null) return { value: input };
        const percent = input.trim().endsWith('%');
        const decimals = (input.trim().replace('%', '').split('.')[1] ?? '').length;
        return { value: number, format: percent ? { kind: 'percent', decimals } : undefined };
    }

    function treeOf(key: string, body: string): Node | null {
        if (trees.has(key)) return trees.get(key)!;
        let tree: Node | null = null;
        try {
            tree = parseFormula(body);
        } catch {
            tree = null;
        }
        trees.set(key, tree);
        return tree;
    }

    function valueAt(address: CellAddress): Scalar {
        const key = keyOf(address);
        const cached = values.get(key);
        if (cached !== undefined) return cached;
        const cell = cells.get(key);
        if (!cell) return null;
        const body = formulaBody(cell.input);
        if (body === null) {
            const value = literal(cell.input).value;
            values.set(key, value);
            return value;
        }
        // A formula that reads its own cell, or one that reads it back, would
        // go round for ever: the first time round says so instead.
        if (visiting.has(key)) return errorValue('#CIRCULAR!');
        visiting.add(key);
        let result: Scalar;
        try {
            const tree = treeOf(key, body);
            const answer = tree ? evaluate(tree, context) : errorValue('#ERROR!');
            result = isRangeValue(answer) ? ((answer as RangeValue).values[0] ?? null) : answer;
        } finally {
            visiting.delete(key);
        }
        values.set(key, result);
        return result;
    }

    function formatValue(value: Scalar, format: CellFormat | undefined): string {
        if (isError(value)) return value.error;
        if (value === null) return '';
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
        const code = options.locale?.code;
        const kind = format?.kind ?? 'general';
        if (typeof value === 'string') return value;
        if (kind === 'text') return String(value);
        if (kind === 'date') return dateFromSerial(value).toLocaleDateString(code, { timeZone: 'UTC' });
        if (kind === 'percent') {
            const decimals = format?.decimals ?? 0;
            return new Intl.NumberFormat(code, { style: 'percent', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
        }
        if (kind === 'currency') {
            const decimals = format?.decimals ?? 2;
            return new Intl.NumberFormat(code, { style: 'currency', currency: format?.currency ?? 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
        }
        if (kind === 'number') {
            const decimals = format?.decimals ?? 2;
            return new Intl.NumberFormat(code, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
        }
        // General: the number as it is, without the noise a binary float
        // leaves behind — 0.1 + 0.2 reads as 0.3, the way it was meant.
        if (!Number.isFinite(value)) return '#VALUE!';
        return String(Number(value.toPrecision(12)));
    }

    // ---- writing

    function patchesFor(entries: { key: string; cell: Cell | undefined }[]): CellPatch[] {
        return entries.map((entry) => ({ key: entry.key, before: cells.get(entry.key), after: entry.cell }));
    }

    function apply(patches: CellPatch[], source: 'edit' | 'undo' | 'redo', direction: 'after' | 'before' = 'after') {
        const keys: string[] = [];
        for (const patch of patches) {
            const next = direction === 'after' ? patch.after : patch.before;
            if (next === undefined) cells.delete(patch.key);
            else cells.set(patch.key, next);
            trees.delete(patch.key);
            const body = next ? formulaBody(next.input) : null;
            if (body === null) deps.remove(patch.key);
            else {
                const tree = treeOf(patch.key, body);
                deps.set(patch.key, tree ? referencesOf(tree) : []);
            }
            keys.push(patch.key);
        }
        // What was edited, and everything that followed from it, is worked out
        // again the next time it is asked for.
        const dirty = deps.dirtyFrom(keys);
        for (const key of keys) values.delete(key);
        for (const key of dirty) values.delete(key);
        listeners.forEach((listener) => listener({ keys, source }));
        events.change?.({ keys, source });
    }

    function commit(patches: CellPatch[]) {
        const real = patches.filter((patch) => !sameCell(patch.before, patch.after));
        if (!real.length) return;
        undoStack.push(real);
        redoStack.length = 0;
        apply(real, 'edit');
    }

    const withInput = (key: string, input: string): Cell | undefined => {
        const previous = cells.get(key);
        const inferred = formulaBody(input) === null ? literal(input).format : undefined;
        const format = previous?.format ?? inferred;
        if (input === '' && !format) return undefined;
        return format ? { input, format } : { input };
    };

    function setInputs(entries: { address: CellAddress; input: string }[]) {
        commit(patchesFor(entries.map((entry) => ({ key: keyOf(entry.address), cell: withInput(keyOf(entry.address), entry.input) }))));
    }

    // ---- filling

    /** `1, 2` carried on is `3, 4`; anything that does not step evenly is copied. */
    function series(source: Scalar[]): ((step: number) => number) | null {
        if (source.length < 2 || source.some((value) => typeof value !== 'number')) return null;
        const run = source as number[];
        const step = run[1]! - run[0]!;
        for (let i = 2; i < run.length; i++) if (run[i]! - run[i - 1]! !== step) return null;
        return (n: number) => run[run.length - 1]! + step * (n + 1);
    }

    /**
     * The handle dragged from one rectangle over another. What is copied is
     * copied with its references carried — that is what fills a column of
     * `=B2*C2` — and a single column of numbers dragged down, or a single row
     * dragged across, carries its run on instead of repeating it.
     */
    function fill(sourceRange: CellRange, targetRange: CellRange) {
        const source = normalizeRange(sourceRange);
        const target = normalizeRange(targetRange);
        const height = rangeRows(source);
        const width = rangeColumns(source);
        const down = target.to.row > source.to.row;
        const along = down
            ? width === 1
                ? series(Array.from({ length: height }, (_, i) => valueAt({ row: source.from.row + i, col: source.from.col })))
                : null
            : height === 1
              ? series(Array.from({ length: width }, (_, i) => valueAt({ row: source.from.row, col: source.from.col + i })))
              : null;
        const entries: { address: CellAddress; input: string }[] = [];

        for (const address of rangeCells(target)) {
            if (address.row >= source.from.row && address.row <= source.to.row && address.col >= source.from.col && address.col <= source.to.col) continue;
            // A run only carries forwards; dragged back over itself, the block
            // repeats, which is what a copy does.
            const step = down ? address.row - source.to.row - 1 : address.col - source.to.col - 1;
            if (along && step >= 0) {
                entries.push({ address, input: String(along(step)) });
                continue;
            }
            const from = { row: source.from.row + mod(address.row - source.from.row, height), col: source.from.col + mod(address.col - source.from.col, width) };
            const cell = cells.get(keyOf(from));
            if (!cell) {
                entries.push({ address, input: '' });
                continue;
            }
            const body = formulaBody(cell.input);
            if (body === null) {
                entries.push({ address, input: cell.input });
                continue;
            }
            const tree = treeOf(keyOf(from), body);
            entries.push({ address, input: tree ? `=${printNode(offsetNode(tree, address.row - from.row, address.col - from.col))}` : cell.input });
        }
        setInputs(entries);
    }

    // ---- the outside

    function usedRange(): CellRange | null {
        let top = Infinity;
        let left = Infinity;
        let bottom = -1;
        let right = -1;
        for (const [key, cell] of cells) {
            if (cell.input === '') continue;
            const { row, col } = fromKey(key);
            top = Math.min(top, row);
            left = Math.min(left, col);
            bottom = Math.max(bottom, row);
            right = Math.max(right, col);
        }
        return bottom < 0 ? null : { from: { row: top, col: left }, to: { row: bottom, col: right } };
    }

    // The cells the sheet was given, before anything is worked out.
    for (const [address, input] of Object.entries(options.cells ?? {})) {
        const ref = parseRef(address);
        if (!ref) continue;
        const key = cellKey(ref.row, ref.col);
        const text = input === null || input === undefined ? '' : String(input);
        const cell = withInput(key, text);
        if (cell) cells.set(key, cell);
    }
    for (const [address, format] of Object.entries(options.formats ?? {})) {
        const range = parseRange(address);
        if (!range) continue;
        for (const cell of rangeCells(range)) {
            const key = keyOf(cell);
            const current = cells.get(key);
            cells.set(key, { input: current?.input ?? '', format: { ...current?.format, ...format } });
        }
    }
    for (const [key, cell] of cells) {
        const body = formulaBody(cell.input);
        if (body === null) continue;
        const tree = treeOf(key, body);
        deps.set(key, tree ? referencesOf(tree) : []);
    }

    return {
        get rows() {
            return rows;
        },
        get columns() {
            return columns;
        },
        input: (address) => cells.get(keyOf(address))?.input ?? '',
        value: valueAt,
        display: (address) => formatValue(valueAt(address), cells.get(keyOf(address))?.format),
        format: (address) => cells.get(keyOf(address))?.format,
        setInput: (address, input) => setInputs([{ address, input }]),
        setInputs,
        setFormat(range, format) {
            const patches = [...rangeCells(range)].map((address) => {
                const key = keyOf(address);
                const current = cells.get(key);
                const next = format === null ? undefined : { ...current?.format, ...format };
                const cell: Cell | undefined = next === undefined && !current?.input ? undefined : { input: current?.input ?? '', ...(next ? { format: next } : {}) };
                return { key, cell };
            });
            commit(patchesFor(patches));
        },
        clear(range) {
            setInputs([...rangeCells(range)].map((address) => ({ address, input: '' })));
        },
        fill,
        paste(anchor, text) {
            const rows = text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');
            const entries: { address: CellAddress; input: string }[] = [];
            rows.forEach((line, row) => {
                line.split('\t').forEach((value, col) => entries.push({ address: { row: anchor.row + row, col: anchor.col + col }, input: value }));
            });
            setInputs(entries);
        },
        copyText(range, copyOptions) {
            const box = normalizeRange(range);
            const lines: string[] = [];
            for (let row = box.from.row; row <= box.to.row; row++) {
                const line: string[] = [];
                for (let col = box.from.col; col <= box.to.col; col++) {
                    const address = { row, col };
                    line.push(copyOptions?.formulas ? (cells.get(keyOf(address))?.input ?? '') : formatValue(valueAt(address), cells.get(keyOf(address))?.format));
                }
                lines.push(line.join('\t'));
            }
            return lines.join('\n');
        },
        undo() {
            const patches = undoStack.pop();
            if (!patches) return false;
            redoStack.push(patches);
            apply(patches, 'undo', 'before');
            return true;
        },
        redo() {
            const patches = redoStack.pop();
            if (!patches) return false;
            undoStack.push(patches);
            apply(patches, 'redo', 'after');
            return true;
        },
        canUndo: () => undoStack.length > 0,
        canRedo: () => redoStack.length > 0,
        usedRange,
        toJSON() {
            const out: Record<string, string> = {};
            for (const [key, cell] of cells) {
                if (cell.input === '') continue;
                const { row, col } = fromKey(key);
                out[`${columnLabel(col)}${row + 1}`] = cell.input;
            }
            return out;
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        resize(size) {
            rows = size.rows ?? rows;
            columns = size.columns ?? columns;
        }
    };
}

const mod = (value: number, by: number) => ((value % by) + by) % by;
const sameCell = (a: Cell | undefined, b: Cell | undefined) => a?.input === b?.input && JSON.stringify(a?.format ?? null) === JSON.stringify(b?.format ?? null);

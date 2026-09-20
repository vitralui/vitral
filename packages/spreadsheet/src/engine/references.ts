import { normalizeRange, parseRef } from './a1';
import type { CellRange } from './types';

/**
 * The places a formula mentions, and where it mentions them, for the outlines
 * a sheet draws over the grid while a formula is being typed.
 *
 * This scans rather than parses, which is the whole point: `=B4*` is not a
 * formula and never will be until the next keypress, and `parseFormula` is
 * right to refuse it — but a person halfway through typing it is exactly who
 * the outlines are for. So the text is read for what looks like an address,
 * outside of any string, and everything else is left alone.
 */
export interface ReferenceSpan {
    /** Where it starts in the source, and the first index past it. */
    start: number;
    end: number;
    /** The reference as it was written: `B4`, `$B$4`, `A1:C9`. */
    text: string;
    /** Where it points, with its corners sorted. */
    range: CellRange;
}

const ADDRESS = /\$?[A-Za-z]{1,3}\$?[0-9]{1,7}(?::\$?[A-Za-z]{1,3}\$?[0-9]{1,7})?/g;
const NAME_PART = /[A-Za-z0-9_.$]/;

/** The stretches of the source inside `"…"`, where an address is only text. */
function strings(source: string): { start: number; end: number }[] {
    const out: { start: number; end: number }[] = [];
    for (let i = 0; i < source.length; i++) {
        if (source[i] !== '"') continue;
        const start = i;
        for (i++; i < source.length; i++) {
            if (source[i] !== '"') continue;
            // `""` is one quote inside the string, not the end of it.
            if (source[i + 1] === '"') i++;
            else break;
        }
        out.push({ start, end: Math.min(i, source.length - 1) });
    }
    return out;
}

/** Every reference in a formula, in the order it was written, repeats included. */
export function formulaReferences(source: string): ReferenceSpan[] {
    if (!source.startsWith('=')) return [];
    const quoted = strings(source);
    const out: ReferenceSpan[] = [];
    ADDRESS.lastIndex = 0;
    for (let match = ADDRESS.exec(source); match; match = ADDRESS.exec(source)) {
        const start = match.index;
        const end = start + match[0].length;
        if (quoted.some((span) => start >= span.start && start <= span.end)) continue;
        // `LOG10(` is a function, `A1B` and `#REF!` are not addresses, and
        // `C4` in either of them is not a reference to C4.
        if (start > 0 && (NAME_PART.test(source[start - 1]!) || source[start - 1] === '#')) continue;
        const after = source[end];
        if (after !== undefined && (NAME_PART.test(after) || after === '(')) continue;
        const [left, right] = match[0].split(':');
        const from = parseRef(left!);
        const to = right === undefined ? from : parseRef(right);
        if (!from || !to) continue;
        out.push({ start, end, text: match[0], range: normalizeRange({ from, to }) });
    }
    return out;
}

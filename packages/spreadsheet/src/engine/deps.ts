import { cellKey, fromKey, normalizeRange, rangeArea, rangeCells, rangeContains } from './a1';
import type { Node } from './parse';
import type { CellRange } from './types';

/**
 * Which formula reads which cell, so an edit only works out what it changed.
 * A single reference is a rectangle one cell wide, and a rectangle small
 * enough is spread over its cells: that makes the lookup one map read per
 * change. A very wide one is kept whole and tested, so a formula over ten
 * thousand cells costs a comparison rather than ten thousand entries.
 */

/** Above this many cells a rectangle is kept whole rather than spread out. */
const SPREAD_LIMIT = 4096;

/** Every cell and rectangle a formula reads, in the order they were written. */
export function referencesOf(node: Node): CellRange[] {
    const out: CellRange[] = [];
    const walk = (current: Node) => {
        switch (current.kind) {
            case 'ref':
                out.push({ from: current.ref, to: current.ref });
                return;
            case 'range':
                out.push(normalizeRange({ from: current.from, to: current.to }));
                return;
            case 'unary':
                walk(current.operand);
                return;
            case 'binary':
                walk(current.left);
                walk(current.right);
                return;
            case 'call':
                current.args.forEach(walk);
                return;
            default:
        }
    };
    walk(node);
    return out;
}

export interface Dependencies {
    /** What this formula reads. Replaces whatever it read before. */
    set(key: string, reads: CellRange[]): void;
    remove(key: string): void;
    clear(): void;
    /** The formulas that read these cells, and the formulas that read those, and so on. */
    dirtyFrom(keys: Iterable<string>): Set<string>;
    /** What one formula reads, for a spec or a trace. */
    reads(key: string): CellRange[];
}

export function createDependencies(): Dependencies {
    /** formula -> what it reads, as it was given. */
    const forward = new Map<string, CellRange[]>();
    /** cell -> the formulas that read it. */
    const readers = new Map<string, Set<string>>();
    /** The rectangles too wide to spread, tested one by one. */
    const wide: { key: string; range: CellRange }[] = [];

    function remove(key: string) {
        const reads = forward.get(key);
        if (!reads) return;
        forward.delete(key);
        for (const range of reads) {
            if (rangeArea(range) <= SPREAD_LIMIT) {
                for (const cell of rangeCells(range)) {
                    const set = readers.get(cellKey(cell.row, cell.col));
                    if (!set) continue;
                    set.delete(key);
                    if (!set.size) readers.delete(cellKey(cell.row, cell.col));
                }
            }
        }
        for (let i = wide.length - 1; i >= 0; i--) if (wide[i]!.key === key) wide.splice(i, 1);
    }

    return {
        reads: (key) => forward.get(key) ?? [],
        remove,
        clear() {
            forward.clear();
            readers.clear();
            wide.length = 0;
        },
        set(key, reads) {
            remove(key);
            forward.set(key, reads);
            for (const range of reads) {
                if (rangeArea(range) > SPREAD_LIMIT) {
                    wide.push({ key, range });
                    continue;
                }
                for (const cell of rangeCells(range)) {
                    const at = cellKey(cell.row, cell.col);
                    let set = readers.get(at);
                    if (!set) readers.set(at, (set = new Set()));
                    set.add(key);
                }
            }
        },
        dirtyFrom(keys) {
            const dirty = new Set<string>();
            const queue = [...keys];
            while (queue.length) {
                const key = queue.pop()!;
                const address = fromKey(key);
                const dependents = readers.get(key);
                if (dependents) {
                    for (const dependent of dependents) {
                        if (dirty.has(dependent)) continue;
                        dirty.add(dependent);
                        queue.push(dependent);
                    }
                }
                for (const entry of wide) {
                    if (dirty.has(entry.key) || !rangeContains(entry.range, address)) continue;
                    dirty.add(entry.key);
                    queue.push(entry.key);
                }
            }
            return dirty;
        }
    };
}

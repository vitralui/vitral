/**
 * The arithmetic of a splitter: panel sizes are percentages that add up to 100,
 * and a gutter moves the boundary between the two panels on either side of it,
 * never pushing either below its minimum. No DOM here: a pointer drag, an arrow
 * key and a React port all come down to these few functions.
 */

const PRECISION = 1e4;

/** Rounds away the float noise (`0.1 + 0.2`) that would otherwise leak into sizes and ARIA values. */
function round(value: number): number {
    return Math.round(value * PRECISION) / PRECISION;
}

/**
 * Sizes for `count` panels from the sizes they asked for. Panels without a size
 * share what the others left; the result is scaled to add up to exactly 100.
 */
export function normalizeSizes(requested: readonly (number | null | undefined)[], count = requested.length): number[] {
    if (count <= 0) return [];
    const given = Array.from({ length: count }, (_, i) => {
        const value = requested[i];
        return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
    });
    const fixed = given.reduce<number>((sum, value) => sum + (value ?? 0), 0);
    const open = given.filter((value) => value === undefined).length;
    const share = open ? Math.max(0, 100 - fixed) / open : 0;
    const sizes = given.map((value) => value ?? share);
    const total = sizes.reduce((sum, value) => sum + value, 0);
    if (total <= 0) return sizes.map(() => round(100 / count));
    return sizes.map((value) => round((value * 100) / total));
}

export interface BoundaryLimits {
    /** The smallest the panel before the gutter may become. */
    min: number;
    /** The largest it may become without squeezing the panel after the gutter below its minimum. */
    max: number;
}

/** How far the gutter after panel `index` can move, expressed as that panel's size. */
export function boundaryLimits(sizes: readonly number[], index: number, minSizes: readonly (number | undefined)[] = []): BoundaryLimits {
    const before = sizes[index] ?? 0;
    const after = sizes[index + 1] ?? 0;
    const pair = before + after;
    const min = Math.min(Math.max(0, minSizes[index] ?? 0), pair);
    const max = Math.max(min, pair - Math.max(0, minSizes[index + 1] ?? 0));
    return { min: round(min), max: round(max) };
}

/**
 * Puts the gutter after panel `index` where the panel before it measures
 * `size`, clamped so both panels keep their minimums. Every other panel is left
 * as it was. Returns a new array.
 */
export function setPanelSize(sizes: readonly number[], index: number, size: number, minSizes: readonly (number | undefined)[] = []): number[] {
    if (index < 0 || index >= sizes.length - 1) return [...sizes];
    const pair = sizes[index]! + sizes[index + 1]!;
    const { min, max } = boundaryLimits(sizes, index, minSizes);
    const before = round(Math.min(max, Math.max(min, size)));
    const next = [...sizes];
    next[index] = before;
    next[index + 1] = round(pair - before);
    return next;
}

/** Moves the gutter after panel `index` by `delta` percentage points (positive grows the panel before it). */
export function resizePanels(sizes: readonly number[], index: number, delta: number, minSizes: readonly (number | undefined)[] = []): number[] {
    return setPanelSize(sizes, index, (sizes[index] ?? 0) + delta, minSizes);
}

/** A pointer movement in pixels as percentage points of the space the panels share. */
export function pixelsToPercent(pixels: number, available: number): number {
    return available > 0 ? (pixels / available) * 100 : 0;
}

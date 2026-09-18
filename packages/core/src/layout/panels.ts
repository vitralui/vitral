/**
 * The decisions a uniform grid and a dock panel make before anything is
 * drawn (how many rows and columns, which docked child takes which corner),
 * written once, without a DOM, for every adapter.
 */

export interface UniformGridInput {
    /** Number of children to lay out. */
    count: number;
    rows?: number | null;
    columns?: number | null;
    /** Empty cells before the first child, in the first row. */
    firstColumn?: number | null;
}

export interface UniformGridSize {
    rows: number;
    columns: number;
    /** The offset actually applied: it is ignored unless it is less than the column count. */
    firstColumn: number;
}

const whole = (value: number | null | undefined): number => Math.max(0, Math.floor(Number(value) || 0));

/**
 * A uniform grid: with neither rows nor columns, a square just big
 * enough for every child; with one of them, the other is however many it takes.
 * `firstColumn` counts as cells taken, and applies only when columns are given
 * and it is smaller than them.
 */
export function uniformGridSize(input: UniformGridInput): UniformGridSize {
    let rows = whole(input.rows);
    let columns = whole(input.columns);
    const firstColumn = columns > 0 && whole(input.firstColumn) < columns ? whole(input.firstColumn) : 0;
    const cells = whole(input.count) + firstColumn;

    if (rows === 0 && columns === 0) {
        rows = columns = Math.ceil(Math.sqrt(cells));
    } else if (rows === 0) {
        rows = Math.ceil(cells / columns);
    } else if (columns === 0) {
        columns = Math.ceil(cells / rows);
    }
    return { rows: Math.max(1, rows), columns: Math.max(1, columns), firstColumn };
}

export type DockEdge = 'top' | 'bottom' | 'left' | 'right';

export type DockArea = DockEdge | 'fill';

/** Top and bottom first, so they span the full width; the sides then take what is left. */
export const defaultDockOrder: readonly DockEdge[] = ['top', 'bottom', 'left', 'right'];

const EDGES = new Set<string>(defaultDockOrder);

/**
 * A docking order from what the caller gave, an array or `'left,right'`,
 * with unknown names and repeats dropped and any edge left out appended in the
 * default order.
 */
export function normalizeDockOrder(order: string | readonly string[] | null | undefined): DockEdge[] {
    const given = typeof order === 'string' ? order.split(/[\s,]+/) : (order ?? []);
    const out: DockEdge[] = [];
    for (const edge of given) {
        const name = edge.trim().toLowerCase();
        if (EDGES.has(name) && !out.includes(name as DockEdge)) out.push(name as DockEdge);
    }
    for (const edge of defaultDockOrder) if (!out.includes(edge)) out.push(edge);
    return out;
}

export interface DockLayout {
    /** One entry per column track, left to right: a docked edge or the fill. */
    columns: DockArea[];
    /** One entry per row track, top to bottom. */
    rows: DockArea[];
    /** The grid, row by row: which area owns each cell. */
    areas: DockArea[][];
}

/**
 * A dock panel as a grid. Each docked child, in order, takes a whole
 * strip along its edge of the space still free, and the fill takes what is
 * left, so whichever edge docks first wins the corners. Tracks exist only for
 * the edges present, so an absent edge leaves neither a track nor a gap.
 */
export function dockLayout(present: Iterable<DockEdge>, order?: string | readonly string[] | null): DockLayout {
    const has = new Set(present);
    const docked = normalizeDockOrder(order).filter((edge) => has.has(edge));
    const columns: DockArea[] = [...(has.has('left') ? ['left' as const] : []), 'fill', ...(has.has('right') ? ['right' as const] : [])];
    const rows: DockArea[] = [...(has.has('top') ? ['top' as const] : []), 'fill', ...(has.has('bottom') ? ['bottom' as const] : [])];
    const areas: DockArea[][] = rows.map(() => columns.map(() => 'fill' as DockArea));

    let top = 0;
    let bottom = rows.length - 1;
    let left = 0;
    let right = columns.length - 1;
    const paint = (r0: number, r1: number, c0: number, c1: number, area: DockEdge) => {
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) areas[r]![c] = area;
    };
    for (const edge of docked) {
        if (edge === 'top') {
            paint(top, top, left, right, 'top');
            top++;
        } else if (edge === 'bottom') {
            paint(bottom, bottom, left, right, 'bottom');
            bottom--;
        } else if (edge === 'left') {
            paint(top, bottom, left, left, 'left');
            left++;
        } else {
            paint(top, bottom, right, right, 'right');
            right--;
        }
    }
    return { columns, rows, areas };
}

/** The layout as `grid-template-areas`: `"top top" "left fill"`. */
export function dockTemplateAreas(layout: DockLayout): string {
    return layout.areas.map((row) => `"${row.join(' ')}"`).join(' ');
}

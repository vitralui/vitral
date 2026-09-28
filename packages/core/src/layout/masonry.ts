/** Where each item of a masonry layout goes, and how tall the whole is. */
export interface MasonryLayout {
    columns: number;
    columnWidth: number;
    positions: { x: number; y: number }[];
    height: number;
}

/**
 * Lays items of any height into columns, each into the shortest column so
 * far, so the columns end as nearly level as the items allow. The order is
 * the items' own — left to right, then down — which is the order a keyboard
 * and a screen reader meet them in. `columns` wins; otherwise as many columns
 * of at least `minColumnWidth` as the width holds.
 */
export function masonryLayout(heights: readonly number[], options: { width: number; gap?: number; columns?: number; minColumnWidth?: number }): MasonryLayout {
    const gap = Math.max(0, options.gap ?? 16);
    const width = Math.max(0, options.width);
    const columns = Math.max(1, Math.floor(options.columns ?? (width + gap) / ((options.minColumnWidth ?? 240) + gap)));
    const columnWidth = Math.max(0, (width - gap * (columns - 1)) / columns);
    const tops = new Array<number>(columns).fill(0);
    const positions = heights.map((h) => {
        let shortest = 0;
        for (let c = 1; c < columns; c++) if (tops[c]! < tops[shortest]! - 0.5) shortest = c;
        const position = { x: shortest * (columnWidth + gap), y: tops[shortest]! };
        tops[shortest] = tops[shortest]! + h + gap;
        return position;
    });
    return { columns, columnWidth, positions, height: Math.max(0, Math.max(...tops, 0) - (heights.length ? gap : 0)) };
}

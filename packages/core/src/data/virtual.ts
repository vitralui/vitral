/**
 * The arithmetic of a virtual scroller: from where a scroll container is and
 * how big its items are, which items to render and how much empty space to
 * leave around them, so a list of a hundred thousand rows costs what a
 * screenful does.
 *
 * Items all have the same size along the scrolling axis. `overscan` items are
 * rendered past each edge of the viewport, so a quick scroll does not show
 * blank space before the next render.
 */
export interface VirtualWindowOptions {
    /** How far the container is scrolled, in pixels. */
    scrollOffset: number;
    /** The container's visible size along the axis, in pixels. */
    viewportSize: number;
    /** One item's size along the axis, in pixels. */
    itemSize: number;
    count: number;
    /** Extra items rendered before and after the visible ones. */
    overscan?: number;
}

export interface VirtualWindow {
    /** Index of the first item to render. */
    first: number;
    /** Index after the last item to render. */
    last: number;
    /** Space before the first rendered item, in pixels. */
    offset: number;
    /** The size of every item together, in pixels — the scroll height. */
    totalSize: number;
    /** The first and last items actually in view, for reporting. */
    visibleFirst: number;
    visibleLast: number;
}

export function virtualWindow(options: VirtualWindowOptions): VirtualWindow {
    const { itemSize, count } = options;
    const size = itemSize > 0 ? itemSize : 1;
    const totalSize = Math.max(0, count) * size;
    const viewport = Math.max(0, options.viewportSize);
    const scroll = Math.max(0, Math.min(options.scrollOffset, Math.max(0, totalSize - viewport)));
    const overscan = Math.max(0, options.overscan ?? Math.ceil(viewport / size / 2));
    const visibleFirst = Math.min(count, Math.floor(scroll / size));
    const visibleLast = Math.min(count, Math.ceil((scroll + viewport) / size));
    const first = Math.max(0, visibleFirst - overscan);
    const last = Math.min(count, Math.max(visibleLast, visibleFirst + 1) + overscan);
    return { first, last, offset: first * size, totalSize, visibleFirst, visibleLast };
}

/**
 * The scroll offset that brings item `index` into view: at the start, the end,
 * or — with `'nearest'` — wherever moves the container least, which is not at
 * all when the item is already visible.
 */
export function scrollOffsetFor(index: number, itemSize: number, viewportSize: number, current: number, align: 'start' | 'end' | 'nearest' = 'nearest'): number {
    const start = Math.max(0, index) * itemSize;
    const end = start + itemSize;
    if (align === 'start') return start;
    if (align === 'end') return Math.max(0, end - viewportSize);
    if (start < current) return start;
    if (end > current + viewportSize) return Math.max(0, end - viewportSize);
    return current;
}

/**
 * The paging of a carousel that shows `numVisible` items and moves
 * `numScroll` at a time. A page is identified by its index; its first item is
 * `page * numScroll`, except the last page, which is pulled back so it is full.
 */
export interface CarouselLayout {
    count: number;
    numVisible: number;
    numScroll: number;
}

export function carouselPageCount({ count, numVisible, numScroll }: CarouselLayout): number {
    if (count <= 0) return 0;
    if (count <= numVisible) return 1;
    return Math.ceil((count - numVisible) / Math.max(1, numScroll)) + 1;
}

/** The index of the first item shown on `page`. */
export function carouselFirst(page: number, layout: CarouselLayout): number {
    const pages = carouselPageCount(layout);
    if (pages <= 1) return 0;
    const p = Math.max(0, Math.min(page, pages - 1));
    return Math.min(p * Math.max(1, layout.numScroll), Math.max(0, layout.count - layout.numVisible));
}

/** The page after (or before) `page`, wrapping when `circular`, staying put at an end otherwise. */
export function carouselStep(page: number, step: 1 | -1, layout: CarouselLayout, circular = false): number {
    const pages = carouselPageCount(layout);
    if (pages === 0) return 0;
    const next = page + step;
    if (next < 0) return circular ? pages - 1 : 0;
    if (next >= pages) return circular ? 0 : pages - 1;
    return next;
}

/** The page that shows item `index` first-most. */
export function carouselPageOf(index: number, layout: CarouselLayout): number {
    const pages = carouselPageCount(layout);
    if (pages <= 1) return 0;
    for (let p = pages - 1; p >= 0; p--) if (carouselFirst(p, layout) <= index) return p;
    return 0;
}

/**
 * Which way a drag pages: 1 for the next page (a swipe towards the start),
 * -1 for the previous, 0 for none — too short, or more across the axis than
 * along it, which is the reader scrolling the page.
 */
export function swipeStep(dx: number, dy: number, options: { vertical?: boolean; threshold?: number; rtl?: boolean } = {}): 1 | -1 | 0 {
    const { vertical = false, threshold = 40, rtl = false } = options;
    const along = vertical ? dy : dx;
    const across = vertical ? dx : dy;
    if (Math.abs(along) < threshold || Math.abs(along) <= Math.abs(across)) return 0;
    const forward = along < 0 !== (rtl && !vertical);
    return forward ? 1 : -1;
}

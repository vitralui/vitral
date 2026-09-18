/**
 * The arithmetic of a paginator, with no rendering in it: how many pages there
 * are, which one `first` falls on, and which page links to show around it. A
 * table, a list and a data view page the same way, in any framework.
 *
 * Pages are 0-based here; add one when showing them to a person.
 */

export interface PageState {
    /** 0-based page index. */
    page: number;
    /** Index of the first row on the page. */
    first: number;
    rows: number;
    pageCount: number;
}

/** At least one page: an empty table is on page 1 of 1, not on page 1 of 0. */
export function pageCount(totalRecords: number, rows: number): number {
    if (!(rows > 0) || !(totalRecords > 0)) return 1;
    return Math.ceil(totalRecords / rows);
}

/** The page `first` falls on. */
export function pageOf(first: number, rows: number): number {
    if (!(rows > 0)) return 0;
    return Math.floor(Math.max(0, first) / rows);
}

/**
 * `first` moved to the start of its page and kept inside the data, so after a
 * filter shrinks the total, a table on page 9 of 3 lands on page 3.
 */
export function clampFirst(first: number, rows: number, totalRecords: number): number {
    if (!(rows > 0)) return 0;
    const last = pageCount(totalRecords, rows) - 1;
    return Math.min(pageOf(first, rows), last) * rows;
}

/** The state after going to `page`, clamped to the pages that exist. */
export function goToPage(page: number, rows: number, totalRecords: number): PageState {
    const count = pageCount(totalRecords, rows);
    const target = Math.min(Math.max(0, Math.trunc(page)), count - 1);
    return { page: target, first: target * rows, rows, pageCount: count };
}

/**
 * The page links to show: a window of `linkSize` pages that keeps the current
 * one in the middle, sliding to stay whole at either end.
 */
export function pageLinks(page: number, count: number, linkSize = 5): number[] {
    const size = Math.max(1, Math.min(linkSize, count));
    const start = Math.max(0, Math.min(page - Math.floor(size / 2), count - size));
    return Array.from({ length: size }, (_, i) => start + i);
}

/** What a page report template may mention: `{first}`, `{last}`, `{total}`, `{page}`, `{pageCount}`, `{rows}`. All 1-based, for people. */
export function pageReportParams(first: number, rows: number, totalRecords: number): Record<'first' | 'last' | 'total' | 'page' | 'pageCount' | 'rows', number> {
    const total = Math.max(0, totalRecords);
    return {
        first: total === 0 ? 0 : Math.min(first + 1, total),
        last: Math.min(first + rows, total),
        total,
        page: pageOf(first, rows) + 1,
        pageCount: pageCount(total, rows),
        rows
    };
}

import { describe, expect, it } from 'vitest';
import { clampFirst, goToPage, pageCount, pageLinks, pageOf, pageReportParams } from './paging';

describe('paging', () => {
    it('counts pages, with at least one', () => {
        expect(pageCount(100, 10)).toBe(10);
        expect(pageCount(101, 10)).toBe(11);
        expect(pageCount(0, 10)).toBe(1);
        expect(pageCount(5, 0)).toBe(1);
    });

    it('finds the page a row index falls on', () => {
        expect(pageOf(0, 10)).toBe(0);
        expect(pageOf(19, 10)).toBe(1);
        expect(pageOf(20, 10)).toBe(2);
        expect(pageOf(-5, 10)).toBe(0);
    });

    it('keeps first on a page that exists after the data shrinks', () => {
        expect(clampFirst(85, 10, 100)).toBe(80);
        expect(clampFirst(80, 10, 25)).toBe(20);
        expect(clampFirst(40, 10, 0)).toBe(0);
    });

    it('goes to a page, clamped to the range', () => {
        expect(goToPage(3, 10, 95)).toEqual({ page: 3, first: 30, rows: 10, pageCount: 10 });
        expect(goToPage(42, 10, 95)).toEqual({ page: 9, first: 90, rows: 10, pageCount: 10 });
        expect(goToPage(-1, 10, 95).page).toBe(0);
    });

    it('centres a window of page links on the current page and slides it at the ends', () => {
        expect(pageLinks(0, 10, 5)).toEqual([0, 1, 2, 3, 4]);
        expect(pageLinks(5, 10, 5)).toEqual([3, 4, 5, 6, 7]);
        expect(pageLinks(9, 10, 5)).toEqual([5, 6, 7, 8, 9]);
        expect(pageLinks(1, 3, 5)).toEqual([0, 1, 2]);
        expect(pageLinks(4, 10, 4)).toEqual([2, 3, 4, 5]);
    });

    it('fills a page report with 1-based numbers', () => {
        expect(pageReportParams(20, 10, 95)).toEqual({ first: 21, last: 30, total: 95, page: 3, pageCount: 10, rows: 10 });
        expect(pageReportParams(90, 10, 95)).toMatchObject({ first: 91, last: 95 });
        expect(pageReportParams(0, 10, 0)).toMatchObject({ first: 0, last: 0, total: 0, page: 1, pageCount: 1 });
    });
});

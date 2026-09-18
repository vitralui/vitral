import { describe, expect, it } from 'vitest';
import { carouselFirst, carouselPageCount, carouselPageOf, carouselStep } from '../layout/carousel';
import { formatFileSize, matchesAccept, takeWithinLimit, validateFile } from './files';

const png = { name: 'Photo.PNG', type: 'image/png', size: 2_400_000 };
const pdf = { name: 'report.pdf', type: 'application/pdf', size: 900 };

describe('file rules', () => {
    it('matches the accept syntax by extension, wildcard and exact type', () => {
        expect(matchesAccept(png, 'image/*')).toBe(true);
        expect(matchesAccept(png, '.png')).toBe(true);
        expect(matchesAccept(pdf, 'image/*, .PDF')).toBe(true);
        expect(matchesAccept(pdf, 'application/json')).toBe(false);
        expect(matchesAccept(pdf, '')).toBe(true);
        expect(matchesAccept({ name: 'x', type: '', size: 1 }, 'image/*')).toBe(false);
    });

    it('reports the first rule a file breaks', () => {
        expect(validateFile(png, { accept: 'image/*', maxFileSize: 1_000_000 })).toBe('size');
        expect(validateFile(pdf, { accept: 'image/*', maxFileSize: 10 })).toBe('type');
        expect(validateFile(pdf, { maxFileSize: 1000 })).toBeNull();
        expect(validateFile(pdf)).toBeNull();
    });

    it('keeps files within a count limit', () => {
        expect(takeWithinLimit([1, 2, 3], 1, 3)).toEqual({ accepted: [1, 2], refused: [3] });
        expect(takeWithinLimit([1, 2], 5, 3)).toEqual({ accepted: [], refused: [1, 2] });
        expect(takeWithinLimit([1, 2], 0)).toEqual({ accepted: [1, 2], refused: [] });
    });

    it('writes sizes in the largest sensible unit, in the reader’s language', () => {
        expect(formatFileSize(532, 'en')).toBe('532 bytes');
        expect(formatFileSize(1, 'en')).toBe('1 byte');
        expect(formatFileSize(1400, 'en')).toBe('1.4 kB');
        expect(formatFileSize(2_400_000, 'en')).toBe('2.4 MB');
        expect(formatFileSize(250_000_000_000, 'en')).toBe('250 GB');
        expect(formatFileSize(2_400_000, 'pt-BR')).toBe('2,4 MB');
        expect(formatFileSize(-3, 'en')).toBe('0 bytes');
    });
});

describe('carousel paging', () => {
    const layout = { count: 10, numVisible: 3, numScroll: 2 };

    it('counts pages and pulls the last one back so it is full', () => {
        expect(carouselPageCount(layout)).toBe(5);
        expect(carouselFirst(0, layout)).toBe(0);
        expect(carouselFirst(3, layout)).toBe(6);
        expect(carouselFirst(4, layout)).toBe(7);
        expect(carouselPageCount({ count: 2, numVisible: 3, numScroll: 1 })).toBe(1);
        expect(carouselPageCount({ count: 0, numVisible: 3, numScroll: 1 })).toBe(0);
        expect(carouselPageCount({ count: 5, numVisible: 1, numScroll: 1 })).toBe(5);
    });

    it('steps, wrapping only when circular, and finds the page for an item', () => {
        expect(carouselStep(4, 1, layout)).toBe(4);
        expect(carouselStep(4, 1, layout, true)).toBe(0);
        expect(carouselStep(0, -1, layout, true)).toBe(4);
        expect(carouselStep(1, -1, layout)).toBe(0);
        expect(carouselPageOf(9, layout)).toBe(4);
        expect(carouselPageOf(5, layout)).toBe(2);
        expect(carouselPageOf(0, layout)).toBe(0);
    });
});

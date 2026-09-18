import { describe, expect, it } from 'vitest';
import { boundaryLimits, normalizeSizes, pixelsToPercent, resizePanels, setPanelSize } from './splitter';

describe('splitter arithmetic', () => {
    it('shares the space panels did not claim, and scales to exactly 100', () => {
        expect(normalizeSizes([undefined, undefined])).toEqual([50, 50]);
        expect(normalizeSizes([20, undefined, undefined])).toEqual([20, 40, 40]);
        expect(normalizeSizes([30, 30])).toEqual([50, 50]);
        expect(normalizeSizes([80, 80, undefined])).toEqual([50, 50, 0]);
        expect(normalizeSizes([], 4)).toEqual([25, 25, 25, 25]);
        expect(normalizeSizes([0, 0])).toEqual([50, 50]);
        expect(normalizeSizes([])).toEqual([]);
    });

    it('moves the boundary between two panels and leaves the others alone', () => {
        expect(resizePanels([50, 50], 0, 5)).toEqual([55, 45]);
        expect(resizePanels([30, 40, 30], 1, -10)).toEqual([30, 30, 40]);
        expect(resizePanels([33.3, 33.3, 33.4], 0, 0.1 + 0.2)).toEqual([33.6, 33, 33.4]);
    });

    it('never pushes either panel below its minimum', () => {
        expect(resizePanels([50, 50], 0, 45, [10, 20])).toEqual([80, 20]);
        expect(resizePanels([50, 50], 0, -45, [10, 20])).toEqual([10, 90]);
        expect(resizePanels([20, 30, 50], 1, 100, [0, 0, 25])).toEqual([20, 55, 25]);
    });

    it('reports the limits of a boundary as the size of the panel before it', () => {
        expect(boundaryLimits([50, 50], 0)).toEqual({ min: 0, max: 100 });
        expect(boundaryLimits([30, 40, 30], 1, [0, 10, 15])).toEqual({ min: 10, max: 55 });
        // Minimums that cannot both be met: the panel before the gutter keeps its own.
        expect(boundaryLimits([50, 50], 0, [70, 70])).toEqual({ min: 70, max: 70 });
    });

    it('sets a panel to an absolute size, clamped, the way Home and End do', () => {
        expect(setPanelSize([40, 60], 0, 0, [15, 25])).toEqual([15, 85]);
        expect(setPanelSize([40, 60], 0, 100, [15, 25])).toEqual([75, 25]);
        expect(setPanelSize([40, 60], 1, 10)).toEqual([40, 60]);
    });

    it('converts a drag distance to percentage points of the shared space', () => {
        expect(pixelsToPercent(50, 500)).toBe(10);
        expect(pixelsToPercent(-25, 1000)).toBe(-2.5);
        expect(pixelsToPercent(10, 0)).toBe(0);
    });
});

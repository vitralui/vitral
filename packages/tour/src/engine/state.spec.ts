import { describe, expect, it } from 'vitest';
import { buttonsOf, formatProgress, pagePath, nextShownIndex, overlayPath, placementOf, positionOf, readProgress, stageOf, stepIndexOf, tweenRect } from './state';
import type { TourStep } from './types';

describe('the tour engine', () => {
    it('turns a side and an alignment into a placement', () => {
        expect(placementOf('bottom', 'start')).toBe('bottom-start');
        expect(placementOf('left', 'center')).toBe('left');
        expect(placementOf()).toBe('bottom-start');
    });

    it('reads the progress template in either spelling', () => {
        expect(formatProgress('{{current}} of {{total}}', 2, 5)).toBe('2 of 5');
        expect(formatProgress('{current}/{total}', 3, 4)).toBe('3/4');
    });

    it('cuts the stage out of the screen, with its corners rounded no more than it can take', () => {
        expect(overlayPath(100, 50, null)).toBe('M0,0H100V50H0Z');
        const stage = stageOf({ x: 10, y: 10, width: 20, height: 10 }, 5);
        expect(stage).toEqual({ x: 5, y: 5, width: 30, height: 20 });
        const path = overlayPath(100, 50, stage, 50);
        expect(path.startsWith('M0,0H100V50H0ZM')).toBe(true);
        // The radius is held to half the shorter side.
        expect(path).toContain('A10,10');
    });

    it('eases a stage from one box to another', () => {
        const a = { x: 0, y: 0, width: 10, height: 10 };
        const b = { x: 100, y: 100, width: 20, height: 20 };
        expect(tweenRect(a, b, 0)).toEqual(a);
        expect(tweenRect(a, b, 1)).toEqual(b);
        expect(tweenRect(a, b, 0.5).x).toBeGreaterThan(50);
    });

    const steps: TourStep[] = [{ id: 'a' }, { id: 'b', when: () => false }, { id: 'c' }, { id: 'd' }];

    it('passes over the steps whose `when` says no, both ways', () => {
        expect(nextShownIndex(steps, 0, 1)).toBe(2);
        expect(nextShownIndex(steps, 2, -1)).toBe(0);
        expect(nextShownIndex(steps, 1, 0)).toBe(2);
        expect(nextShownIndex(steps, 3, 1)).toBe(-1);
        expect(positionOf(steps, 2)).toEqual({ current: 2, total: 3 });
    });

    it('finds a step by its place or its id', () => {
        expect(stepIndexOf(steps, 'c')).toBe(2);
        expect(stepIndexOf(steps, 9)).toBe(-1);
        expect(stepIndexOf(steps, 'z')).toBe(-1);
    });

    it("takes a step's buttons over the tour's, and drops close when closing is not allowed", () => {
        const { shown } = buttonsOf({ popover: { showButtons: ['next'] } }, { showButtons: ['next', 'close'] });
        expect([...shown]).toEqual(['next']);
        expect(buttonsOf({}, { allowClose: false }).shown.has('close')).toBe(false);
    });

    it('reads what it stored without trusting it', () => {
        expect(readProgress('{"index":3,"done":true}')).toEqual({ index: 3, done: true, pending: false });
        expect(readProgress('{"index":-1}')).toEqual({ index: 0, done: false, pending: false });
        expect(readProgress('{"index":2,"done":false,"pending":true}')).toEqual({ index: 2, done: false, pending: true });
        expect(readProgress('not json')).toBeNull();
        expect(readProgress(null)).toBeNull();
    });
});

import { describe, expect, it } from 'vitest';
import { radialOffset } from './radial';

describe('radialOffset', () => {
    it('spreads a full circle evenly, starting to the right', () => {
        expect(radialOffset(0, 4, 'circle', 'up', 80)).toEqual({ x: 80, y: 0 });
        expect(radialOffset(1, 4, 'circle', 'up', 80)).toEqual({ x: 0, y: 80 });
        expect(radialOffset(2, 4, 'circle', 'up', 80)).toEqual({ x: -80, y: 0 });
    });

    it('opens a half circle towards its direction', () => {
        expect(radialOffset(1, 3, 'semi-circle', 'up', 50)).toEqual({ x: 0, y: -50 });
        expect(radialOffset(1, 3, 'semi-circle', 'down', 50)).toEqual({ x: 0, y: 50 });
        expect(radialOffset(1, 3, 'semi-circle', 'left', 50)).toEqual({ x: -50, y: 0 });
        expect(radialOffset(1, 3, 'semi-circle', 'right', 50)).toEqual({ x: 50, y: 0 });
        expect(radialOffset(0, 3, 'semi-circle', 'up', 50)).toEqual({ x: 50, y: 0 });
    });

    it('opens a quarter circle into its corner', () => {
        expect(radialOffset(0, 2, 'quarter-circle', 'up-left', 60)).toEqual({ x: -60, y: 0 });
        expect(radialOffset(1, 2, 'quarter-circle', 'up-left', 60)).toEqual({ x: 0, y: -60 });
        expect(radialOffset(1, 2, 'quarter-circle', 'down-right', 60)).toEqual({ x: 0, y: 60 });
        expect(radialOffset(0, 2, 'quarter-circle', 'up-right', 60)).toEqual({ x: 0, y: -60 });
        expect(radialOffset(0, 2, 'quarter-circle', 'down-left', 60)).toEqual({ x: 0, y: 60 });
        expect(radialOffset(0, 1, 'quarter-circle', 'down-right', 60)).toEqual({ x: 60, y: 0 });
    });
});

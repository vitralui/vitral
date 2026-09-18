import { describe, expect, it } from 'vitest';
import { sunburstArcs, type SunburstNode } from './sunburst';

const leaf = (name: string, value: number): SunburstNode => ({ name, value, series: 0, index: 0, children: [] });
const branch = (name: string, children: SunburstNode[]): SunburstNode => ({ name, value: 0, series: 0, index: 0, children });

describe('sunburst arcs', () => {
    const tree = [branch('Europe', [leaf('France', 30), leaf('Spain', 10)]), branch('Asia', [leaf('Japan', 40), leaf('Korea', 20)])];

    it('gives a branch the total of its children', () => {
        const arcs = sunburstArcs(tree);
        expect(arcs.find((a) => a.name === 'Europe')!.total).toBe(40);
        expect(arcs.find((a) => a.name === 'Asia')!.total).toBe(60);
    });

    it('divides the circle by share, and each branch by its own', () => {
        const arcs = sunburstArcs(tree);
        const at = (name: string) => arcs.find((a) => a.name === name)!;
        expect(at('Europe').start).toBe(0);
        expect(at('Europe').end).toBeCloseTo(144, 6);
        expect(at('Asia').end).toBeCloseTo(360, 6);
        // A child sits inside its parent's wedge, taking its share of it.
        expect(at('France').start).toBe(at('Europe').start);
        expect(at('France').end).toBeCloseTo(108, 6);
        expect(at('Spain').end).toBeCloseTo(at('Europe').end, 6);
        expect(at('Korea').end).toBeCloseTo(at('Asia').end, 6);
    });

    it('puts each level on its own ring', () => {
        const deep = sunburstArcs([branch('a', [branch('b', [leaf('c', 1)])])]);
        expect(deep.map((a) => [a.name, a.depth])).toEqual([
            ['a', 0],
            ['b', 1],
            ['c', 2]
        ]);
    });

    it('draws nothing from nothing', () => {
        expect(sunburstArcs([])).toEqual([]);
        expect(sunburstArcs([leaf('a', 0)])).toEqual([]);
    });
});

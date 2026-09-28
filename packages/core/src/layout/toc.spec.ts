import { describe, expect, it } from 'vitest';
import { activeOutlineIndex, normalizeOutline } from './toc';

describe('an outline', () => {
    it('marks the last heading that has passed the top', () => {
        expect(activeOutlineIndex([100, 400, 900], 0)).toBe(0);
        expect(activeOutlineIndex([-300, 20, 600], 64)).toBe(1);
        expect(activeOutlineIndex([-900, -500, -10], 0)).toBe(2);
        expect(activeOutlineIndex([-900, 100, 300], 0, true)).toBe(2);
        expect(activeOutlineIndex([], 0)).toBe(-1);
    });

    it('starts its levels at the shallowest heading there is', () => {
        expect(normalizeOutline([{ id: 'a', label: 'A', level: 2 }, { id: 'b', label: 'B', level: 3 }]).map((i) => i.level)).toEqual([1, 2]);
    });
});

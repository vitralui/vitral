import { en, ptBR } from '@vitral/core';
import { afterEach, describe, expect, it } from 'vitest';
import { summaryOf } from './engine/state';
import { createTaskboard, type TaskboardHandle } from './taskboard';

const cards = [
    { id: 1, title: 'Spec', column: 'todo', lane: 'web', points: 3 },
    { id: 2, title: 'Design', column: 'todo', lane: 'app', points: '5' },
    { id: 3, title: 'Build', column: 'doing', lane: 'web', points: 8 },
    { id: 4, title: 'Party', column: 'done', lane: 'app' }
];
const entries = cards.map((item) => ({ item, column: item.column, lane: item.lane }));

let handle: TaskboardHandle | null = null;
afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe("a column's summary", () => {
    it('adds up a field of its cards, reading numeric text and passing over the rest', () => {
        expect(summaryOf(entries, (e) => e.column === 'todo', { field: 'points' }, en)).toBe('8');
        expect(summaryOf(entries, (e) => e.column === 'done', { field: 'points' }, en)).toBe('0');
        expect(summaryOf(entries, () => true, { field: 'points', type: 'average', format: '{value} avg' }, en)).toBe('5.3 avg');
        expect(summaryOf(entries, () => true, { field: 'points', type: 'max' }, en)).toBe('8');
        expect(summaryOf(entries, (e) => e.column === 'done', { field: 'points', type: 'min' }, en)).toBeNull();
        expect(summaryOf(entries, () => true, undefined, en)).toBeNull();
        expect(summaryOf(entries, () => true, { field: 'points', type: 'average' }, ptBR)).toBe('5,3');
    });

    it("is drawn beside each column's count, and each lane's", () => {
        const element = document.createElement('div');
        document.body.appendChild(element);
        handle = createTaskboard(element, {
            columns: [{ key: 'todo', title: 'To do' }, { key: 'doing', title: 'Doing' }, { key: 'done', title: 'Done' }],
            items: cards,
            laneField: 'lane',
            summary: { field: 'points', format: '{value} pts' }
        });
        const texts = Array.from(element.querySelectorAll('.vt-taskboard-summary')).map((el) => el.textContent);
        expect(texts).toEqual(expect.arrayContaining(['8 pts', '8 pts', '0 pts', '11 pts', '5 pts']));
        expect(texts).toHaveLength(5);
    });
});

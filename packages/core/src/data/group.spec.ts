import { describe, expect, it } from 'vitest';
import { flattenGroups, groupKeyOf, groupRows } from './group';

interface Person {
    name: string;
    team: string | null;
    seats?: number;
}

const people: Person[] = [
    { name: 'Ada', team: 'Engineering' },
    { name: 'Grace', team: 'Ops' },
    { name: 'Alan', team: 'Engineering' },
    { name: 'Edsger', team: null },
    { name: 'Barbara', team: 'Ops' }
];

describe('rows gathered by what they have in common', () => {
    it('gathers by value, not by adjacency, so a sort on another column survives it', () => {
        const groups = groupRows(people, 'team');
        // Ada and Alan are not next to each other and still share a group.
        expect(groups.map((g) => [g.value, g.rows.map((r) => r.name)])).toEqual([
            ['Engineering', ['Ada', 'Alan']],
            ['Ops', ['Grace', 'Barbara']],
            [null, ['Edsger']]
        ]);
    });

    it('keeps the groups in the order their first row appeared, so the sort still leads', () => {
        const sorted = [...people].sort((a, b) => a.name.localeCompare(b.name));
        // Ada leads once sorted by name, so Engineering leads the groups.
        expect(groupRows(sorted, 'team').map((g) => g.value)).toEqual(['Engineering', 'Ops', null]);
    });

    it('gives the two values that are not values a key of their own', () => {
        expect(groupKeyOf(null)).not.toBe(groupKeyOf(undefined));
        expect(groupKeyOf(null)).not.toBe(groupKeyOf('null'));
        expect(groupKeyOf(3)).toBe(groupKeyOf(3));
        const day = new Date(2026, 0, 2);
        expect(groupKeyOf(day)).toBe(groupKeyOf(new Date(2026, 0, 2)));
    });

    it('flattens back into the lines a table draws, a heading over each run', () => {
        const groups = groupRows(people, 'team');
        const lines = flattenGroups(groups, people, new Set());
        expect(lines.map((l) => (l.kind === 'group' ? `[${String(l.group.value)}]` : (l.row as Person).name))).toEqual([
            '[Engineering]',
            'Ada',
            'Alan',
            '[Ops]',
            'Grace',
            'Barbara',
            '[null]',
            'Edsger'
        ]);
    });

    it('leaves out the rows of a collapsed group but keeps its heading', () => {
        const groups = groupRows(people, 'team');
        const lines = flattenGroups(groups, people, new Set([groups[0]!.key]));
        expect(lines.filter((l) => l.kind === 'row').map((l) => (l.row as Person).name)).toEqual(['Grace', 'Barbara', 'Edsger']);
        expect(lines.find((l) => l.kind === 'group' && l.group.value === 'Engineering')).toMatchObject({ collapsed: true });
    });

    it('keeps each row the index it had before grouping, which is its identity elsewhere', () => {
        const groups = groupRows(people, 'team');
        const lines = flattenGroups(groups, people, new Set());
        const rows = lines.filter((l) => l.kind === 'row') as { row: Person; index: number }[];
        // Alan is fourth on the page but third in the data, and it is the data
        // that selection, the keyboard and every event speak in.
        expect(rows.map((r) => [r.row.name, r.index])).toEqual([
            ['Ada', 0],
            ['Alan', 2],
            ['Grace', 1],
            ['Barbara', 4],
            ['Edsger', 3]
        ]);
    });
});

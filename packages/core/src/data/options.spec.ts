import { describe, expect, it } from 'vitest';
import { flattenOptions, groupOptions, optionDisabled, optionLabel, optionValue } from './options';

const fields = { optionLabel: 'name', optionValue: 'code', optionDisabled: 'off' };
const cities = [
    { name: 'Lisboa', code: 'LIS' },
    { name: 'Porto', code: 'OPO', off: true },
    { name: 'Faro', code: 'FAO' }
];

describe('option fields', () => {
    it('reads label, value and disabled through the configured fields', () => {
        expect(optionLabel(cities[0], fields)).toBe('Lisboa');
        expect(optionValue(cities[0], fields)).toBe('LIS');
        expect(optionDisabled(cities[1], fields)).toBe(true);
        expect(optionDisabled(cities[0], fields)).toBe(false);
    });

    it('uses the option itself without fields, and an empty label for nothing', () => {
        expect(optionLabel('plain', {})).toBe('plain');
        expect(optionValue('plain', {})).toBe('plain');
        expect(optionLabel(null, {})).toBe('');
        expect(optionLabel({ a: { b: 7 } }, { optionLabel: 'a.b' })).toBe('7');
    });
});

describe('groupOptions', () => {
    it('returns one unlabelled group for a flat list, filtered and indexed', () => {
        const [group] = groupOptions(cities, fields, (o) => (o as { name: string }).name !== 'Lisboa');
        expect(group!.label).toBeNull();
        expect(group!.items.map((i) => [i.index, i.label, i.value, i.disabled])).toEqual([
            [0, 'Porto', 'OPO', true],
            [1, 'Faro', 'FAO', false]
        ]);
    });

    it('indexes across groups in reading order and drops groups left empty', () => {
        const grouped = [
            { label: 'North', items: [{ name: 'Porto' }, { name: 'Braga' }] },
            { label: 'Islands', items: [{ name: 'Funchal' }] },
            { label: 'South', children: [{ name: 'Faro' }] }
        ];
        const groups = groupOptions(grouped, { optionLabel: 'name', optionGroupLabel: 'label' }, (o) => (o as { name: string }).name !== 'Funchal');
        expect(groups.map((g) => g.label)).toEqual(['North']);
        expect(groups[0]!.items.map((i) => i.index)).toEqual([0, 1]);
        const custom = groupOptions(grouped, { optionLabel: 'name', optionGroupLabel: 'label', optionGroupChildren: 'children' });
        expect(custom.map((g) => g.label)).toEqual(['South']);
        expect(flattenOptions(grouped, { optionGroupLabel: 'label' })).toHaveLength(3);
        expect(flattenOptions(cities, {})).toEqual(cities);
    });
});

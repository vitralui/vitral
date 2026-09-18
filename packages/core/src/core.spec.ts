import { describe, expect, it } from 'vitest';
import {
    createDataSource,
    createStyleRegistry,
    createNumberFormat,
    deepMerge,
    equals,
    filterTree,
    flattenTree,
    FilterService,
    firstIndex,
    formatDate,
    lastIndex,
    monthGrid,
    parseDate,
    ptBR,
    queryData,
    setChecked,
    sortData,
    stepIndex,
    stepValue,
    toKebab,
    typeaheadIndex,
    loadStyle,
    ZIndex
} from './index';

describe('object utilities', () => {
    it('merges deeply without letting undefined erase a key', () => {
        expect(deepMerge({ a: { b: 1, c: 2 }, list: [1, 2] }, { a: { c: 3 }, list: [9] }, { a: { b: undefined } })).toEqual({ a: { b: 1, c: 3 }, list: [9] });
    });

    it('compares structurally, or by data key', () => {
        expect(equals({ a: [1, { b: new Date(0) }] }, { a: [1, { b: new Date(0) }] })).toBe(true);
        expect(equals({ id: 1, n: 'x' }, { id: 1, n: 'y' }, 'id')).toBe(true);
    });

    it('turns token names into property names', () => {
        expect(toKebab('paddingX')).toBe('padding-x');
        expect(toKebab('selectedFocusBackground')).toBe('selected-focus-background');
    });
});

describe('filtering, sorting and querying', () => {
    const people = [
        { name: 'João', city: 'São Paulo', age: 31 },
        { name: 'ana', city: 'Rio', age: null },
        { name: 'Bruno', city: 'Recife', age: 22 },
        { name: 'Item 10', city: 'Rio', age: 40 },
        { name: 'Item 9', city: 'Rio', age: 18 }
    ];

    it('matches without regard to case or accents', () => {
        expect(FilterService.matches('São Paulo', 'sao', 'startsWith')).toBe(true);
        expect(FilterService.matches('JOÃO', 'joao', 'equals')).toBe(true);
        expect(FilterService.matches('x', '', 'equals')).toBe(true);
        expect(FilterService.matches(5, [1, 10], 'between')).toBe(true);
    });

    it('sorts naturally, stably, and keeps empty values last either way', () => {
        expect(sortData(people, [{ field: 'name', order: 1 }]).map((p) => p.name)).toEqual(['ana', 'Bruno', 'Item 9', 'Item 10', 'João']);
        expect(sortData(people, [{ field: 'age', order: -1 }]).map((p) => p.age)).toEqual([40, 31, 22, 18, null]);
        expect(sortData(people, [{ field: 'age', order: 1 }]).map((p) => p.age)).toEqual([18, 22, 31, 40, null]);
    });

    it('filters, then sorts, then pages, and counts before paging', () => {
        const result = queryData(people, {
            filters: { city: { value: 'r', matchMode: 'startsWith' } },
            sort: [{ field: 'name', order: 1 }],
            first: 1,
            rows: 2
        });
        expect(result.total).toBe(4);
        expect(result.items.map((p) => p.name)).toEqual(['Bruno', 'Item 9']);
    });

    it('answers local and remote data through one interface', async () => {
        const local = createDataSource(people);
        expect((await local.load({ rows: 2 })).items).toHaveLength(2);
        const remote = createDataSource({ load: (o) => ({ items: [], total: o.rows ?? 0 }) });
        expect(remote.remote).toBe(true);
        expect((await remote.load({ rows: 7 })).total).toBe(7);
    });
});

describe('list navigation', () => {
    const disabled = (i: number) => i === 1;
    it('steps over disabled items and stops at the ends unless looping', () => {
        expect(stepIndex(4, 0, 1, disabled)).toBe(2);
        expect(stepIndex(4, 3, 1, disabled)).toBe(3);
        expect(stepIndex(4, 3, 1, disabled, true)).toBe(0);
        expect(firstIndex(3, (i) => i === 0)).toBe(1);
        expect(lastIndex(3, () => true)).toBe(-1);
    });

    it('cycles through matches when a letter is repeated', () => {
        const labels = ['Apple', 'Avocado', 'Banana', 'Ábaco'];
        expect(typeaheadIndex(labels, 'a', -1)).toBe(0);
        expect(typeaheadIndex(labels, 'aa', 0)).toBe(1);
        expect(typeaheadIndex(labels, 'aaa', 1)).toBe(3);
        expect(typeaheadIndex(labels, 'ban', -1)).toBe(2);
    });
});

describe('trees', () => {
    const nodes = [
        { key: 'a', label: 'Documents', children: [{ key: 'a1', label: 'Work' }, { key: 'a2', label: 'Home' }] },
        { key: 'b', label: 'Pictures' }
    ];

    it('flattens what is expanded with the ARIA position of each node', () => {
        const flat = flattenTree(nodes, { a: true });
        expect(flat.map((f) => [f.node.key, f.level, f.posInSet, f.setSize])).toEqual([
            ['a', 1, 1, 2],
            ['a1', 2, 1, 2],
            ['a2', 2, 2, 2],
            ['b', 1, 2, 2]
        ]);
    });

    it('propagates checks down and partial state up', () => {
        let state = setChecked(nodes, {}, nodes[0]!.children![0]!, true);
        expect(state.a).toEqual({ checked: false, partialChecked: true });
        state = setChecked(nodes, state, nodes[0]!.children![1]!, true);
        expect(state.a).toEqual({ checked: true, partialChecked: false });
        state = setChecked(nodes, state, nodes[0]!, false);
        expect(state).toEqual({});
    });

    it('prunes to matches and expands the path to each', () => {
        const { nodes: kept, expandedKeys } = filterTree(nodes, 'hom');
        expect(kept.map((n) => n.key)).toEqual(['a']);
        expect(kept[0]!.children!.map((n) => n.key)).toEqual(['a2']);
        expect(expandedKeys).toEqual({ a: true });
    });
});

describe('dates', () => {
    it('lays a month out as six full weeks from the first weekday', () => {
        const weeks = monthGrid(2026, 1, 1, new Date(2026, 1, 14));
        expect(weeks).toHaveLength(6);
        expect(weeks[0]![0]!.date.getDay()).toBe(1);
        expect(weeks.flat().find((d) => d.today)?.day).toBe(14);
    });

    it('formats with locale names and reads back only real dates', () => {
        expect(formatDate(new Date(2026, 2, 5), "dd 'de' MMMM 'de' yyyy", ptBR)).toBe('05 de março de 2026');
        expect(formatDate(new Date(2026, 2, 5, 7, 4, 9), 'dd/MM HH:mm:ss H', ptBR)).toBe('05/03 07:04:09 7');
        expect(parseDate('05/03/2026', 'dd/MM/yyyy')?.getMonth()).toBe(2);
        expect(parseDate('31/02/2026', 'dd/MM/yyyy')).toBeNull();
        expect(parseDate('1/2/26', 'd/M/yy')?.getFullYear()).toBe(2026);
    });
});

describe('numbers', () => {
    it('reads back what it formats in the same locale', () => {
        const brl = createNumberFormat({ locale: 'pt-BR', mode: 'currency', currency: 'BRL' });
        expect(brl.parse(brl.format(1234.56))).toBe(1234.56);
        expect(brl.parse('R$ -1.234,5')).toBe(-1234.5);
        expect(createNumberFormat({ locale: 'en-US' }).parse('1,234.5')).toBe(1234.5);
        expect(createNumberFormat({ locale: 'en-US' }).parse('')).toBeNull();
    });

    it('steps without floating-point drift and within bounds', () => {
        expect(stepValue(0.2, 0.1, 1)).toBe(0.3);
        expect(stepValue(9, 5, 1, 0, 10)).toBe(10);
        expect(stepValue(null, 1, 1, 3)).toBe(3);
    });
});

describe('z-index', () => {
    it('stacks each new layer above every earlier one, whatever its kind', () => {
        const modal = document.createElement('div');
        const popup = document.createElement('div');
        expect(ZIndex.set('modal', modal, 1100)).toBe(1100);
        expect(ZIndex.set('overlay', popup, 1000)).toBe(1101);
        ZIndex.clear(popup);
        ZIndex.clear(modal);
        expect(modal.style.zIndex).toBe('');
    });
});

describe('the style registry', () => {
    it('keeps each stylesheet once, in order, and writes it as head markup', () => {
        const registry = createStyleRegistry();
        expect(registry.add('base', '.vt-a{}')).toBe(true);
        expect(registry.add('button', '.vt-b{}')).toBe(true);
        expect(registry.add('base', '.vt-a{}')).toBe(false);
        expect(registry.entries().map((e) => e.name)).toEqual(['base', 'button']);
        expect(registry.css()).toBe('.vt-a{}\n.vt-b{}');
        expect(registry.tags()).toBe('<style data-vitral-style="base">.vt-a{}</style>\n<style data-vitral-style="button">.vt-b{}</style>');
        registry.clear();
        expect(registry.entries()).toEqual([]);
    });

    it('uses the nonce and the CSS layer it was configured with', () => {
        const registry = createStyleRegistry({ nonce: 'n0nce', cssLayer: 'vitral' });
        registry.add('button', '.vt-b{}');
        expect(registry.css()).toBe('@layer vitral {\n.vt-b{}\n}');
        expect(registry.tags()).toContain('nonce="n0nce"');
    });

    it('escapes anything that would close the style element', () => {
        const registry = createStyleRegistry();
        registry.add('x', '.a{content:"</style><script>"}');
        expect(registry.tags()).not.toContain('</style><script>');
        expect(registry.tags().endsWith('</style>')).toBe(true);
    });

    it('injects into the document in a browser and leaves the registry empty', () => {
        const registry = createStyleRegistry();
        loadStyle('spec-injected', '.vt-spec{}', { registry });
        expect(document.head.querySelector('style[data-vitral-style="spec-injected"]')).not.toBeNull();
        expect(registry.entries()).toEqual([]);
    });
});

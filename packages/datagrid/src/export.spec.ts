import { afterEach, describe, expect, it, vi } from 'vitest';
import { csvField, toCSV } from './engine/export';
import { tableColumns } from './engine/state';
import { createDataGrid, type DataGridHandle } from './grid';

interface Person {
    id: number;
    name: string;
    city: string;
    joined: Date;
}

const people: Person[] = [
    { id: 1, name: 'Ana Souza', city: 'São Paulo', joined: new Date(Date.UTC(2024, 0, 2)) },
    { id: 2, name: 'Lima, Bruno', city: 'Recife', joined: new Date(Date.UTC(2025, 5, 9)) },
    { id: 3, name: '=HYPERLINK("x")', city: 'He said "hi"', joined: new Date(Date.UTC(2026, 1, 3)) }
];

const columns = [
    { selectionMode: 'multiple' as const },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'city', header: 'City' },
    { field: 'joined', header: 'Joined', exportValue: (p: Person) => p.joined.toISOString().slice(0, 10) },
    { key: 'actions', header: 'Actions', body: () => 'Edit' }
];

let handle: DataGridHandle<Person> | null = null;
afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('a CSV field', () => {
    it('is quoted only when it has to be, with its quotes doubled', () => {
        expect(csvField('plain')).toBe('plain');
        expect(csvField('a,b')).toBe('"a,b"');
        expect(csvField('a;b', ';')).toBe('"a;b"');
        expect(csvField('say "hi"')).toBe('"say ""hi"""');
        expect(csvField('two\nlines')).toBe('"two\nlines"');
        expect(csvField(null)).toBe('');
        expect(csvField(42)).toBe('42');
        expect(csvField(-3)).toBe('-3');
    });

    it('keeps a spreadsheet from running what looks like a formula', () => {
        expect(csvField('=1+1')).toBe("'=1+1");
        expect(csvField('@cmd')).toBe("'@cmd");
        expect(csvField('=1+1', ',', false)).toBe('=1+1');
    });
});

describe('toCSV', () => {
    it('writes the columns with something to write, leaving out selection and drawn-only ones', () => {
        const resolved = tableColumns({ columns }, { first: 0, rows: 10, sortField: null, sortOrder: 0, multiSortMeta: [], filters: {}, selection: null, columnLayout: null } as never);
        const text = toCSV(people, resolved);
        expect(text.split('\r\n')).toEqual([
            'Name,City,Joined',
            'Ana Souza,São Paulo,2024-01-02',
            '"Lima, Bruno",Recife,2025-06-09',
            `"'=HYPERLINK(""x"")","He said ""hi""",2026-02-03`
        ]);
        expect(toCSV(people.slice(0, 1), resolved, { header: false, separator: ';', columns: ['city', 'name'] })).toBe('São Paulo;Ana Souza');
    });
});

describe('the table handle', () => {
    function mount(config: Record<string, unknown> = {}) {
        const element = document.createElement('div');
        document.body.appendChild(element);
        handle = createDataGrid<Person>(element, { value: people, dataKey: 'id', columns, ariaLabel: 'People', ...config });
        return handle;
    }

    it('exports what the filters let through, the page, or the selection, in the order on show', () => {
        const table = mount({ paginator: true, rows: 2, sortField: 'name', sortOrder: -1, selection: [people[1]] });
        expect(table.toCSV({ header: false, columns: ['name'] }).split('\r\n')).toEqual(['"Lima, Bruno"', 'Ana Souza', `"'=HYPERLINK(""x"")"`]);
        expect(table.toCSV({ header: false, columns: ['name'], scope: 'page' }).split('\r\n')).toHaveLength(2);
        expect(table.toCSV({ header: false, columns: ['name'], scope: 'selection' })).toBe('"Lima, Bruno"');
        expect(table.toCSV({ bom: true }).startsWith('﻿')).toBe(true);
    });

    it('hands the reader a file', () => {
        const table = mount();
        const created: Blob[] = [];
        const createObjectURL = vi.fn((blob: Blob) => (created.push(blob), 'blob:x'));
        Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
            expect(this.download).toBe('people.csv');
        });
        table.exportCSV({ filename: 'people.csv' });
        expect(click).toHaveBeenCalledOnce();
        expect(created[0]!.type).toBe('text/csv;charset=utf-8');
        click.mockRestore();
    });
});

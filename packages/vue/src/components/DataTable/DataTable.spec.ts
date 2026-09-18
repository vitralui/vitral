import { createDataSource } from '@vitral/core';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, type VNode } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Column from './Column.vue';
import type { ColumnLayoutLike } from './types';
import DataTable from './DataTable.vue';

interface Person {
    id: number;
    name: string;
    city: string;
    country: string;
    age: number;
    status: string;
}

const people: Person[] = [
    { id: 1, name: 'Ana Souza', city: 'São Paulo', country: 'Brazil', age: 34, status: 'active' },
    { id: 2, name: 'Bruno Lima', city: 'Recife', country: 'Brazil', age: 28, status: 'away' },
    { id: 3, name: 'Carla Mendes', city: 'Lisboa', country: 'Portugal', age: 45, status: 'active' },
    { id: 4, name: 'Diego Ferreira', city: 'Porto', country: 'Portugal', age: 31, status: 'offline' },
    { id: 5, name: 'Élise Martin', city: 'Montréal', country: 'Canada', age: 39, status: 'active' },
    { id: 6, name: 'Fatou Diallo', city: 'Dakar', country: 'Senegal', age: 26, status: 'away' },
    { id: 7, name: 'Gustavo Rocha', city: 'São Luís', country: 'Brazil', age: 52, status: 'active' },
    { id: 8, name: 'Hanna Müller', city: 'München', country: 'Germany', age: 41, status: 'offline' },
    { id: 9, name: 'Iñaki Etxeberria', city: 'Bilbao', country: 'Spain', age: 37, status: 'active' },
    { id: 10, name: 'João Pereira', city: 'Coimbra', country: 'Portugal', age: 23, status: 'away' },
    { id: 11, name: 'Kenji Sato', city: 'Tōkyō', country: 'Japan', age: 48, status: 'active' },
    { id: 12, name: 'Lucía Gómez', city: 'Córdoba', country: 'Argentina', age: 30, status: 'offline' }
];

const defaultColumns = () => [
    h(Column, { field: 'name', header: 'Name', sortable: true }),
    h(Column, { field: 'city', header: 'City', sortable: true }),
    h(Column, { field: 'country', header: 'Country', sortable: true }),
    h(Column, { field: 'age', header: 'Age', sortable: true, align: 'right' })
];

type Models = 'first' | 'rows' | 'sortField' | 'sortOrder' | 'multiSortMeta' | 'filters' | 'selection';

function mountTable(props: Record<string, unknown> = {}, columns: () => VNode[] = defaultColumns) {
    const models = {
        first: ref(props.first ?? 0),
        rows: ref(props.rows ?? 10),
        sortField: ref(props.sortField ?? null),
        sortOrder: ref(props.sortOrder ?? null),
        multiSortMeta: ref(props.multiSortMeta ?? null),
        filters: ref(props.filters),
        selection: ref(props.selection ?? null)
    } satisfies Record<Models, unknown>;
    const listeners = { onPage: vi.fn(), onSort: vi.fn(), onFilter: vi.fn(), onLazyLoad: vi.fn(), onRowClick: vi.fn(), onRowSelect: vi.fn() };
    const bound = () =>
        Object.fromEntries(
            (Object.keys(models) as Models[]).flatMap((name) => [
                [name, models[name].value],
                [`onUpdate:${name}`, (v: unknown) => (models[name].value = v)]
            ])
        );
    const wrapper = mountVt(
        defineComponent(
            () => () =>
                h(DataTable, { 'aria-label': 'People', value: people, dataKey: 'id', ...props, ...bound(), ...listeners }, { default: columns })
        )
    );
    const table = () => document.querySelector<HTMLTableElement>('table')!;
    const bodyRows = () => Array.from(table().tBodies[0]!.rows);
    const column = (i: number) => bodyRows().map((r) => r.cells[i]!.textContent?.trim());
    const header = (name: string) => Array.from(table().tHead!.rows[0]!.cells).find((th) => th.textContent?.includes(name))!;
    const sortButton = (name: string) => header(name).querySelector('button')!;
    return { wrapper, models, listeners, table, bodyRows, column, header, sortButton };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('DataTable', () => {
    it('is a table named by its label, with scoped column headers, rendering every row', () => {
        const { table, column } = mountTable();
        expect(table().getAttribute('aria-label')).toBe('People');
        const ths = Array.from(table().querySelectorAll('th'));
        expect(ths.map((th) => th.textContent?.trim())).toEqual(['Name', 'City', 'Country', 'Age']);
        expect(ths.every((th) => th.getAttribute('scope') === 'col')).toBe(true);
        expect(column(1)).toEqual(people.map((p) => p.city));
    });

    it('takes a caption as its name, hidden unless asked to show', () => {
        const { table } = mountTable({ caption: 'Team members', 'aria-label': undefined });
        const caption = table().querySelector('caption')!;
        expect(caption.textContent).toBe('Team members');
        expect(caption.className).toBe('vt-sr-only');
    });

    it('sorts from a header button, announces it with aria-sort, and cycles back off when removable', async () => {
        const { sortButton, header, column, models, listeners } = mountTable({ removableSort: true });
        sortButton('Age').click();
        await nextTick();
        expect(column(3)).toEqual(['23', '26', '28', '30', '31', '34', '37', '39', '41', '45', '48', '52']);
        expect(header('Age').getAttribute('aria-sort')).toBe('ascending');
        expect(header('Name').hasAttribute('aria-sort')).toBe(false);
        expect(models.sortField.value).toBe('age');
        expect(listeners.onSort).toHaveBeenLastCalledWith(expect.objectContaining({ sortField: 'age', sortOrder: 1 }));

        sortButton('Age').click();
        await nextTick();
        expect(column(3)[0]).toBe('52');
        expect(header('Age').getAttribute('aria-sort')).toBe('descending');

        sortButton('Age').click();
        await nextTick();
        expect(header('Age').hasAttribute('aria-sort')).toBe(false);
        expect(column(0)[0]).toBe('Ana Souza');
    });

    it('adds a column to a multiple sort with Ctrl-click, saying the secondary direction in text', async () => {
        const { sortButton, header, column, models } = mountTable({ sortMode: 'multiple' });
        sortButton('Country').click();
        await nextTick();
        sortButton('Age').dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
        await nextTick();
        expect(models.multiSortMeta.value).toEqual([
            { field: 'country', order: 1 },
            { field: 'age', order: 1 }
        ]);
        // Argentina, then Brazil youngest first.
        expect(column(0).slice(0, 4)).toEqual(['Lucía Gómez', 'Bruno Lima', 'Ana Souza', 'Gustavo Rocha']);
        expect(header('Country').getAttribute('aria-sort')).toBe('ascending');
        expect(header('Age').hasAttribute('aria-sort')).toBe(false);
        expect(header('Age').querySelector('.vt-sr-only')?.textContent).toBe('Sorted ascending');
    });

    it('filters from a row of named inputs, accent-blind, and reports an empty result', async () => {
        const filters = { city: { value: null, matchMode: 'startsWith' }, name: { value: null, matchMode: 'contains' } };
        const { table, column, listeners, models } = mountTable({ filters, filterDisplay: 'row' });
        const inputs = Array.from(table().querySelectorAll<HTMLInputElement>('thead input'));
        expect(inputs.map((i) => i.getAttribute('aria-label'))).toEqual(['Filter Name', 'Filter City']);
        inputs[1]!.value = 'sao';
        inputs[1]!.dispatchEvent(new Event('input'));
        await nextTick();
        await nextTick();
        expect(column(1)).toEqual(['São Paulo', 'São Luís']);
        expect(listeners.onFilter).toHaveBeenCalled();
        expect((models.filters.value as Record<string, { value: unknown }>).city.value).toBe('sao');
        inputs[0]!.value = 'zzz';
        inputs[0]!.dispatchEvent(new Event('input'));
        await nextTick();
        await nextTick();
        expect(column(0)).toEqual(['No results found']);
    });

    it('searches every global filter field at once', async () => {
        const { column } = mountTable({ filters: { global: { value: 'portugal', matchMode: 'contains' } }, globalFilterFields: ['name', 'country'] });
        expect(column(0)).toEqual(['Carla Mendes', 'Diego Ferreira', 'João Pereira']);
    });

    it('pages with its paginator and goes back to the first page when the sort changes', async () => {
        const { bodyRows, column, models, listeners, sortButton } = mountTable({ paginator: true, rows: 5 });
        expect(bodyRows()).toHaveLength(5);
        const nav = document.querySelector('nav')!;
        expect(nav.getAttribute('aria-label')).toBe('Pagination');
        Array.from(nav.querySelectorAll('button')).find((b) => b.getAttribute('aria-label') === 'Next')!.click();
        await nextTick();
        expect(models.first.value).toBe(5);
        expect(column(0)[0]).toBe('Fatou Diallo');
        expect(listeners.onPage).toHaveBeenLastCalledWith({ page: 1, first: 5, rows: 5, pageCount: 3 });
        sortButton('Name').click();
        await nextTick();
        expect(models.first.value).toBe(0);
    });

    it('computes nothing when lazy: it emits the load options and shows value as the page', async () => {
        const page = people.slice(0, 5);
        const { listeners, column, sortButton } = mountTable({ lazy: true, paginator: true, rows: 5, totalRecords: 40, value: page });
        expect(listeners.onLazyLoad).toHaveBeenCalledTimes(1);
        expect(listeners.onLazyLoad.mock.calls[0]![0]).toMatchObject({ first: 0, rows: 5, sort: [], filters: {} });
        expect(document.querySelector('.vt-paginator-last')).not.toBeNull();
        sortButton('Age').click();
        await nextTick();
        expect(listeners.onLazyLoad.mock.lastCall![0]).toMatchObject({ sort: [{ field: 'age', order: 1 }] });
        expect(column(0)).toEqual(page.map((p) => p.name));
        Array.from(document.querySelectorAll('nav button')).find((b) => b.getAttribute('aria-label') === 'Last page')!.dispatchEvent(new MouseEvent('click'));
        await nextTick();
        expect(listeners.onLazyLoad.mock.lastCall![0]).toMatchObject({ first: 35, rows: 5 });
    });

    it('reads its rows from a data source, paging through it', async () => {
        const { column, table } = mountTable({ value: undefined, dataSource: createDataSource(people), paginator: true, rows: 4 });
        expect(table().getAttribute('aria-busy')).toBe('true');
        await settle();
        await nextTick();
        expect(column(0)).toEqual(people.slice(0, 4).map((p) => p.name));
        expect(table().hasAttribute('aria-busy')).toBe(false);
        expect(document.querySelector('[aria-current="page"]')).not.toBeNull();
        expect(document.querySelectorAll('.vt-paginator-page')).toHaveLength(3);
    });

    it('selects a row on click in single mode, and moves between rows with the arrows', async () => {
        const { bodyRows, models, listeners } = mountTable({ selectionMode: 'single' });
        expect(bodyRows().map((r) => r.tabIndex).slice(0, 3)).toEqual([0, -1, -1]);
        bodyRows()[1]!.cells[0]!.click();
        await nextTick();
        expect(models.selection.value).toEqual(people[1]);
        expect(bodyRows()[1]!.getAttribute('aria-selected')).toBe('true');
        expect(bodyRows()[0]!.getAttribute('aria-selected')).toBe('false');
        expect(listeners.onRowClick).toHaveBeenCalled();
        expect(listeners.onRowSelect).toHaveBeenCalledWith(expect.objectContaining({ data: people[1], type: 'row' }));

        bodyRows()[1]!.focus();
        await press(bodyRows()[1]!, 'ArrowDown');
        expect(document.activeElement).toBe(bodyRows()[2]);
        await press(bodyRows()[2]!, ' ');
        expect(models.selection.value).toEqual(people[2]);
        await press(bodyRows()[2]!, 'End');
        expect(document.activeElement).toBe(bodyRows()[11]);
    });

    it('has a checkbox column with a select-all that turns mixed when some rows are chosen', async () => {
        const columns = () => [h(Column, { selectionMode: 'multiple' }), ...defaultColumns()];
        const { table, models } = mountTable({ selection: [] }, columns);
        const selectAll = table().querySelector<HTMLInputElement>('thead input[type="checkbox"]')!;
        const rowBoxes = () => Array.from(table().querySelectorAll<HTMLInputElement>('tbody input[type="checkbox"]'));
        expect(selectAll.getAttribute('aria-label')).toBe('Select all');
        expect(rowBoxes()[0]!.getAttribute('aria-label')).toBe('Select row');

        rowBoxes()[0]!.click();
        await nextTick();
        expect(models.selection.value).toEqual([people[0]]);
        expect(selectAll.indeterminate).toBe(true);
        expect(selectAll.checked).toBe(false);
        expect(table().tBodies[0]!.rows[0]!.getAttribute('aria-selected')).toBe('true');

        selectAll.click();
        await nextTick();
        expect(models.selection.value).toHaveLength(people.length);
        expect(selectAll.checked).toBe(true);
        expect(selectAll.indeterminate).toBe(false);

        selectAll.click();
        await nextTick();
        expect(models.selection.value).toEqual([]);
    });

    it('reads kebab-case and bare boolean attributes from a Column, as a template writes them', () => {
        const RawColumn = Column as unknown as import('vue').Component;
        const columns = () => [h(RawColumn, { 'column-key': 'who', field: 'name', header: 'Who', sortable: '', 'sort-field': 'id' })];
        const { header } = mountTable({}, columns);
        expect(header('Who').querySelector('button')).not.toBeNull();
    });

    it('renders body, header and footer slots', () => {
        const columns = () => [
            h(Column, { field: 'name' }, { header: () => h('em', 'Person'), body: ({ data }: { data: Person }) => h('strong', data.name.toUpperCase()), footer: () => '12 people' })
        ];
        const { table, column } = mountTable({}, columns);
        expect(table().querySelector('thead em')?.textContent).toBe('Person');
        expect(column(0)[0]).toBe('ANA SOUZA');
        expect(table().tFoot?.textContent?.trim()).toBe('12 people');
    });

    it('covers itself while loading and marks the table busy', () => {
        const { table } = mountTable({ loading: true });
        expect(table().getAttribute('aria-busy')).toBe('true');
        expect(document.querySelector('[role="status"]')?.textContent).toContain('Loading…');
    });

    it('says when there is nothing to show', () => {
        const { column } = mountTable({ value: [], emptyMessage: 'No people yet' });
        expect(column(0)).toEqual(['No people yet']);
    });

    it('has no accessibility violations: sorted, filtered, paged, selectable, loading and empty', async () => {
        const columns = () => [h(Column, { selectionMode: 'multiple' }), ...defaultColumns()];
        mountTable(
            { paginator: true, rows: 5, rowsPerPageOptions: [5, 10], sortField: 'name', sortOrder: 1, filters: { name: { value: 'a', matchMode: 'contains' } }, filterDisplay: 'row', selectionMode: 'multiple', selection: [people[0]], stripedRows: true },
            columns
        );
        await expectNoA11yViolations();
        document.body.innerHTML = '';
        mountTable({ selectionMode: 'single' }, () => [h(Column, { selectionMode: 'single' }), ...defaultColumns()]);
        await expectNoA11yViolations();
        document.body.innerHTML = '';
        mountTable({ loading: true, caption: 'People', 'aria-label': undefined });
        await expectNoA11yViolations();
        document.body.innerHTML = '';
        mountTable({ value: [] });
        await expectNoA11yViolations();
    });
});

describe('DataTable columns', () => {
    /** A table whose layout the test owns, the way an application would. */
    function mountLayout(props: Record<string, unknown> = {}, columns: () => VNode[] = defaultColumns) {
        const layout = ref<ColumnLayoutLike | null | undefined>((props.columnLayout as ColumnLayoutLike) ?? null);
        const events: { name: string; key: string }[] = [];
        mountVt(
            defineComponent(
                () => () =>
                    h(
                        DataTable,
                        {
                            'aria-label': 'People',
                            value: people,
                            dataKey: 'id',
                            ...props,
                            columnLayout: layout.value,
                            'onUpdate:columnLayout': (v: ColumnLayoutLike | null | undefined) => (layout.value = v),
                            'onColumn-resize': (e: { key: string }) => events.push({ name: 'resize', key: e.key }),
                            'onColumn-reorder': (e: { key: string }) => events.push({ name: 'reorder', key: e.key }),
                            'onColumn-toggle': (e: { key: string }) => events.push({ name: 'toggle', key: e.key }),
                            'onColumn-pin': (e: { key: string }) => events.push({ name: 'pin', key: e.key })
                        },
                        { default: columns }
                    )
            )
        );
        const headers = () => Array.from(document.querySelectorAll<HTMLTableCellElement>('thead tr:first-child th'));
        const headings = () => headers().map((th) => th.textContent?.trim().split('\n')[0] ?? '');
        const resizer = (name: string) => headers().find((th) => th.textContent?.includes(name))!.querySelector<HTMLElement>('[role="separator"]')!;
        return { layout, events, headers, headings, resizer };
    }

    it('draws the columns in the order the layout gives, and leaves out what it hides', async () => {
        const { headings } = mountLayout({ columnLayout: { order: ['age', 'name'], hidden: ['country'] } });
        await nextTick();
        expect(headings()).toEqual(['Age', 'Name', 'City']);
    });

    it('offers a resize handle that names its column and answers the keyboard', async () => {
        const { layout, events, resizer } = mountLayout({ resizableColumns: true });
        await nextTick();
        const handle = resizer('City');
        expect(handle.getAttribute('aria-label')).toBe('Resize City');
        expect(handle.getAttribute('aria-orientation')).toBe('vertical');
        await press(handle, 'ArrowRight');
        expect(events).toEqual([{ name: 'resize', key: 'city' }]);
        // The width is written into the layout, which is what an application stores.
        expect(layout.value?.widths).toBeTruthy();
        const widths = layout.value!.widths as Record<string, number>;
        expect(widths.city).toBeGreaterThan(0);
    });

    it('takes the width from the next column so the table keeps its own', async () => {
        const { layout, resizer } = mountLayout({ resizableColumns: true, columnLayout: { widths: { name: 200, city: 200, country: 200, age: 200 } } });
        await nextTick();
        await press(resizer('Name'), 'ArrowRight');
        const widths = layout.value!.widths as Record<string, number>;
        expect(widths.name + widths.city).toBe(400);
        expect(widths.name).toBe(216);
    });

    it('moves a column with Ctrl and an arrow, and says where it went', async () => {
        const { layout, events, headings, headers } = mountLayout({ reorderableColumns: true });
        await nextTick();
        const city = headers().find((th) => th.textContent?.includes('City'))!;
        await press(city, 'ArrowLeft', { ctrlKey: true });
        expect(headings()).toEqual(['City', 'Name', 'Country', 'Age']);
        expect(layout.value?.order).toEqual(['city', 'name', 'country', 'age']);
        expect(events).toEqual([{ name: 'reorder', key: 'city' }]);
        // At the edge there is nowhere to go.
        const first = headers()[0]!;
        await press(first, 'ArrowLeft', { ctrlKey: true });
        expect(headings()).toEqual(['City', 'Name', 'Country', 'Age']);
    });

    it('sticks a pinned column to its edge, with the ones beside it stacked', async () => {
        const { headers } = mountLayout({ columnLayout: { widths: { name: 150, city: 120 }, pinned: { name: 'left', city: 'left', age: 'right' } } });
        await nextTick();
        const [name, city] = headers();
        expect(name!.style.position).toBe('sticky');
        // The leading and trailing edge, not the left and the right: a
        // right-to-left table pins the same column to the other side.
        expect(name!.style.getPropertyValue('inset-inline-start')).toBe('0px');
        expect(city!.style.getPropertyValue('inset-inline-start')).toBe('150px');
        expect(headers().find((th) => th.textContent?.includes('Age'))!.style.getPropertyValue('inset-inline-end')).toBe('0px');
        // The pinned ones are at the edges whatever order they were declared in.
        expect(headers().map((th) => th.textContent?.trim().split('\n')[0])).toEqual(['Name', 'City', 'Country', 'Age']);
    });

    it('opens a list of columns and shows or hides one from it', async () => {
        const { layout, events, headings } = mountLayout({ columnToggle: true });
        await nextTick();
        const button = document.querySelector<HTMLButtonElement>('.vt-datatable-chooser-button')!;
        expect(button.textContent).toContain('Columns');
        button.click();
        await nextTick();
        await new Promise((r) => setTimeout(r, 0));
        const boxes = Array.from(document.querySelectorAll<HTMLInputElement>('.vt-datatable-chooser-checkbox'));
        expect(boxes).toHaveLength(4);
        expect(boxes.every((box) => box.checked)).toBe(true);
        boxes[1]!.checked = false;
        boxes[1]!.dispatchEvent(new Event('change', { bubbles: true }));
        await nextTick();
        expect(layout.value?.hidden).toEqual(['city']);
        expect(headings()).toEqual(['Name', 'Country', 'Age']);
        expect(events).toEqual([{ name: 'toggle', key: 'city' }]);
        await expectNoA11yViolations();
    });
});

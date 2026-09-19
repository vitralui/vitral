/**
 * The addons: the parts of Vitral that are written as plain TypeScript and
 * draw themselves, so a React, an Angular or a no-framework page gets the same
 * thing the Vue component gives. Each one is an engine (the arithmetic, with
 * no DOM in it) and a renderer, and the Vue component is a wrapper over it.
 */
export interface AddonEntry {
    /** Some of them draw nothing: they are the state and the arithmetic a component runs on. */
    headless?: boolean;
    /** The package, without the scope. */
    id: string;
    name: string;
    /** What it is called in a menu, where the package name is too long to scan. */
    title: string;
    /** One line: what it draws. */
    summary: string;
    /** A shorter line, for a menu. */
    note: string;
    icon: string;
    /** Where a menu entry goes: the page that shows the thing off. */
    to: string;
    /** The component page it backs. */
    component: string;
    /** What the engine entry holds on its own. */
    engine: string;
    /** A first use, framework-free. */
    example: string;
}

export const addons: AddonEntry[] = [
    {
        id: 'chart',
        name: '@vitral/chart',
        title: 'Charts',
        note: 'Every kind, drawn live with its options',
        to: '/charts',
        summary: 'SVG charts: line, area, bar, pie, radar, heat map, candlestick and the rest, with axes, legend, tooltip, zoom and export.',
        icon: 'areaChart',
        component: 'chart',
        engine: 'scales, ticks and the scene: every mark placed, before anything is drawn',
        example: `import { createChart } from '@vitral/chart';

const chart = createChart(document.querySelector('#sales'), {
    type: 'area',
    series: [{ name: 'Visits', data: [12, 41, 35, 51] }],
    options: { chart: { height: 240 } }
});

chart.update({ series });`
    },
    {
        id: 'datatable',
        name: '@vitral/datatable',
        title: 'DataTable',
        note: 'Sort, filter, page, select, arrange the columns',
        to: '/components/datatable',
        summary: 'A real <table>: sorting, filtering, paging, selection, and columns the reader resizes, moves, pins and hides.',
        icon: 'grip',
        component: 'datatable',
        engine: 'which columns, in what order and at what width; which rows, sorted, filtered and paged',
        example: `import { createDataTable } from '@vitral/datatable';

const table = createDataTable(document.querySelector('#people'), {
    value: people,
    dataKey: 'id',
    columns: [
        { field: 'name', header: 'Name', sortable: true },
        { field: 'city', header: 'City', sortable: true }
    ],
    paginator: true,
    rows: 10
});`
    },
    {
        id: 'schedule',
        name: '@vitral/schedule',
        title: 'Schedule',
        note: 'Month, week, day, agenda and timeline',
        to: '/components/schedule',
        summary: 'A calendar and scheduler: month, week, day, agenda and timeline, with recurrence, drag and drop, and a keyboard that does the same.',
        icon: 'calendar',
        component: 'schedule',
        engine: 'which views, which period, what is on in it and what everything is called',
        example: `import { createSchedule } from '@vitral/schedule';

const schedule = createSchedule(document.querySelector('#week'), {
    view: 'week',
    events: [{ id: 1, title: 'Standup', start: '2026-09-14T09:00', end: '2026-09-14T09:15' }],
    on: { 'event-change': ({ start, end, revert }) => save(start, end).catch(revert) }
});`
    },
    {
        id: 'taskboard',
        name: '@vitral/taskboard',
        title: 'Taskboard',
        note: 'Columns, swimlanes and accessible dragging',
        to: '/components/taskboard',
        summary: 'A task board: columns, swimlanes, work-in-progress limits, and drag and drop that a keyboard can do too.',
        icon: 'columns',
        component: 'taskboard',
        engine: 'which lanes there are, which card sits where, and whether a move into a cell is allowed',
        example: `import { createTaskboard } from '@vitral/taskboard';

const board = createTaskboard(document.querySelector('#sprint'), {
    columns: [
        { key: 'todo', title: 'To do' },
        { key: 'doing', title: 'Doing', wipLimit: 2 },
        { key: 'done', title: 'Done' }
    ],
    items: tasks,
    on: { 'card-move': ({ item, to }) => save(item, to) }
});`
    },
    {
        id: 'editor',
        name: '@vitral/editor',
        title: 'Editor',
        note: 'Rich text, with a slash menu and block actions',
        to: '/components/editor',
        summary: 'A rich text editor: the toolbar, the panels, the floating toolbar over a selection, the menu a slash opens and the handle beside a block.',
        icon: 'pencil',
        component: 'editor',
        engine: 'the document, the commands, the undo history and the input rules, which live in @vitral/core',
        example: `import { createTextEditor } from '@vitral/editor';

const editor = createTextEditor(document.querySelector('#notes'), {
    content: '<p>Hello</p>',
    placeholder: 'Write something…',
    on: { change: ({ html }) => save(html) }
});`
    },
    {
        id: 'forms',
        name: '@vitral/forms',
        title: 'Form',
        note: 'Values, validation and submit state',
        to: '/components/form',
        headless: true,
        summary: 'Form state and validation: nested and array paths, dirty and touched per field, async rules, field arrays, and resolvers for Zod, Yup, Valibot and the rest.',
        icon: 'check',
        component: 'form',
        engine: 'the whole package is the engine: it draws nothing at all',
        example: `import { createForm, rules } from '@vitral/forms';

const form = createForm({
    initialValues: { email: '' },
    fields: { email: { rules: [rules.required(), rules.email()] } }
});

await form.submit(async (values) => save(values));`
    }
];

/** The layer the addons render with, which is not one of them. */
export const domPackage = {
    name: '@vitral/dom',
    summary: 'a keyed patcher, the part-and-pass-through resolver, a pointer drag, an auto-scroll and an icon. The little it takes to put a component on a page.'
};

/** The controls an addon needs but should not be writing again. */
export const controlsPackage = {
    name: '@vitral/controls',
    summary: 'the select, the menu and the anchored panel, over the same core arithmetic and wearing the same styles — so a page with no framework gets the control the framework would have drawn.'
};

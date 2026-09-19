/**
 * The addons: the parts of Vitral that are written as plain TypeScript and
 * draw themselves, so a React, an Angular or a no-framework page gets the same
 * thing the Vue component gives. Each one is an engine (the arithmetic, with
 * no DOM in it) and a renderer, and the Vue component is a wrapper over it.
 */
export interface AddonEntry {
    /** The package, without the scope. */
    id: string;
    name: string;
    /** One line: what it draws. */
    summary: string;
    icon: string;
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
    }
];

/** The layer the addons render with, which is not one of them. */
export const domPackage = {
    name: '@vitral/dom',
    summary: 'What the addons share: a keyed patcher, the part-and-pass-through resolver, a pointer drag and an auto-scroll. No framework in any of it.'
};

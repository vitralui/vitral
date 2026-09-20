/**
 * The addons: the parts of Vitral written as plain TypeScript, which draw
 * themselves, so a React, an Angular or a no-framework page gets the same
 * thing the Vue component gives. The top bar lists them and points at the
 * page that shows each one off.
 */
export interface AddonEntry {
    /** The package, without the scope. */
    id: string;
    name: string;
    /** What it is called in a menu, where the package name is too long to scan. */
    title: string;
    /** A line for a menu: what it draws. */
    note: string;
    icon: string;
    /** Where a menu entry goes: the page that shows the thing off. */
    to: string;
    /** The component page it backs. */
    component: string;
}

export const addons: AddonEntry[] = [
    {
        id: 'chart',
        name: '@vitral/chart',
        title: 'Charts',
        note: 'Every kind, drawn live with its options',
        icon: 'areaChart',
        to: '/charts',
        component: 'chart'
    },
    {
        id: 'datagrid',
        name: '@vitral/datagrid',
        title: 'DataGrid',
        note: 'Sort, filter, page, select, arrange the columns',
        icon: 'grip',
        to: '/components/datagrid',
        component: 'datagrid'
    },
    {
        id: 'schedule',
        name: '@vitral/schedule',
        title: 'Schedule',
        note: 'Month, week, day, agenda and timeline',
        icon: 'calendar',
        to: '/components/schedule',
        component: 'schedule'
    },
    {
        id: 'taskboard',
        name: '@vitral/taskboard',
        title: 'Taskboard',
        note: 'Columns, swimlanes and accessible dragging',
        icon: 'columns',
        to: '/components/taskboard',
        component: 'taskboard'
    },
    {
        id: 'editor',
        name: '@vitral/editor',
        title: 'Editor',
        note: 'Rich text, with a slash menu and block actions',
        icon: 'pencil',
        to: '/components/editor',
        component: 'editor'
    },
    {
        id: 'spreadsheet',
        name: '@vitral/spreadsheet',
        title: 'Spreadsheet',
        note: 'Cells, formulas and the graph between them',
        icon: 'table',
        to: '/components/spreadsheet',
        component: 'spreadsheet'
    },
    {
        id: 'forms',
        name: '@vitral/forms',
        title: 'Form',
        note: 'Values, validation and submit state',
        icon: 'check',
        to: '/components/form',
        component: 'form'
    }
];

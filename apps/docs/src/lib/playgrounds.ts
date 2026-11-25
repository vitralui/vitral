import {
    Avatar,
    Badge,
    Button,
    Checkbox,
    Chip,
    Column,
    DataGrid,
    InputNumber,
    InputText,
    Message,
    ProgressBar,
    Rating,
    Select,
    Skeleton,
    Slider,
    Tag,
    Taskboard,
    Textarea,
    ToggleSwitch
} from '@vitral/vue';
import { h, type Component, type VNodeChild } from 'vue';

/**
 * What a component's playground starts from: the component, the props it is
 * drawn with at first, and which of its props get a control. A control's kind
 * is read from the prop's type in the component's `types.ts` (a switch for a
 * boolean, a choice for a union of words, a number, a text), so a prop added
 * to the library can be offered here by adding its name to `controls`.
 *
 * Props a reader cannot sensibly type (lists of rows, functions) are given in
 * `fixed`, and shown in the code as `fixedCode` with the `script` that
 * declares them.
 */
export interface PlaygroundSpec {
    /** The tag the code is written with. */
    tag: string;
    component: Component;
    /** Starting values of props that have a control. */
    props?: Record<string, unknown>;
    /** Props passed as they are, with no control. */
    fixed?: Record<string, unknown>;
    /** How `fixed` is written in the code: `:options="cities"`. */
    fixedCode?: string;
    /** A starting value for `v-model`, kept as it changes. */
    model?: unknown;
    /** Starting values for named `v-model`s (`v-model:items`), kept as they change and written in the code as refs. */
    models?: Record<string, unknown>;
    /** The props with a control, in the order they are shown. */
    controls: string[];
    /** What goes inside the component, and how the code writes it. */
    children?: () => VNodeChild;
    childrenCode?: string;
    /** The `<script setup>` the code needs, for what `fixedCode` names. */
    script?: string;
    /** The component wants the whole width of the stage (a table, a board). */
    wide?: boolean;
}

/** A value as it would be written in a script: single quotes, bare keys, an entry a line when it does not fit on one. */
export function literal(value: unknown, indent = ''): string {
    if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    if (Array.isArray(value)) {
        const items = value.map((item) => literal(item, `${indent}    `));
        const flat = `[${items.join(', ')}]`;
        return flat.length + indent.length <= 72 && !flat.includes('\n') ? flat : `[\n${items.map((item) => `${indent}    ${item}`).join(',\n')}\n${indent}]`;
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value).map(([key, item]) => `${/^[A-Za-z_$][\w$]*$/.test(key) ? key : literal(key)}: ${literal(item, `${indent}    `)}`);
        return entries.length ? `{ ${entries.join(', ')} }` : '{}';
    }
    return String(value);
}

const cities = ['Lisbon', 'São Paulo', 'Kraków', 'Zürich', 'Tōkyō'];

const orders = [
    { id: 1041, customer: 'Ana Souza', items: 3, total: 418.5 },
    { id: 1042, customer: 'Bruno Lima', items: 1, total: 89.9 },
    { id: 1043, customer: 'Carla Mendes', items: 6, total: 1240 },
    { id: 1044, customer: 'Diego Ramos', items: 2, total: 156 },
    { id: 1045, customer: 'Elisa Prado', items: 4, total: 732.4 }
];

const board = {
    columns: [
        { key: 'todo', title: 'To do' },
        { key: 'doing', title: 'Doing', subtitle: 'Two at most' },
        { key: 'held', title: 'On hold', collapsed: true },
        { key: 'done', title: 'Done' }
    ],
    items: [
        { id: 1, title: 'Write the brief', column: 'todo' },
        { id: 2, title: 'Pick the fabric', column: 'todo' },
        { id: 3, title: 'Cut the pattern', column: 'doing' }
    ]
};

export const playgrounds: Record<string, PlaygroundSpec> = {
    Button: {
        tag: 'Button',
        component: Button,
        props: { label: 'Save changes' },
        controls: ['label', 'icon', 'iconPos', 'severity', 'variant', 'size', 'rounded', 'raised', 'loading', 'disabled', 'badge', 'fluid']
    },
    Tag: { tag: 'Tag', component: Tag, props: { value: 'Shipped', severity: 'success' }, controls: ['value', 'severity', 'icon', 'rounded', 'removable'] },
    Badge: { tag: 'Badge', component: Badge, props: { value: '4' }, controls: ['value', 'severity', 'size'] },
    Avatar: { tag: 'Avatar', component: Avatar, props: { label: 'GW' }, controls: ['label', 'icon', 'size', 'shape'] },
    Chip: { tag: 'Chip', component: Chip, props: { label: 'Design' }, controls: ['label', 'icon', 'removable'] },
    Message: {
        tag: 'Message',
        component: Message,
        props: { severity: 'info', title: 'Saved' },
        controls: ['title', 'severity', 'variant', 'icon', 'hideIcon', 'closable'],
        children: () => 'Your changes are live for everyone on the team.',
        childrenCode: 'Your changes are live for everyone on the team.'
    },
    InputText: {
        tag: 'InputText',
        component: InputText,
        model: 'Gustavo',
        fixed: { 'aria-label': 'Name' },
        fixedCode: 'aria-label="Name"',
        controls: ['size', 'variant', 'clearable', 'invalid', 'disabled', 'readonly', 'fluid']
    },
    Textarea: {
        tag: 'Textarea',
        component: Textarea,
        model: 'A short note about the order.',
        props: { rows: 3 },
        fixed: { 'aria-label': 'Note' },
        fixedCode: 'aria-label="Note"',
        controls: ['rows', 'autoResize', 'resize', 'size', 'variant', 'invalid', 'disabled', 'readonly', 'fluid']
    },
    InputNumber: {
        tag: 'InputNumber',
        component: InputNumber,
        model: 1465,
        props: { mode: 'currency', currency: 'BRL', locale: 'pt-BR' },
        fixed: { 'aria-label': 'Amount' },
        fixedCode: 'aria-label="Amount"',
        controls: ['mode', 'currency', 'locale', 'minFractionDigits', 'maxFractionDigits', 'showButtons', 'buttonLayout', 'step', 'size', 'variant', 'invalid', 'disabled']
    },
    Select: {
        tag: 'Select',
        component: Select,
        model: null,
        props: { placeholder: 'Pick a city' },
        fixed: { options: cities, 'aria-label': 'City' },
        fixedCode: ':options="cities" aria-label="City"',
        script: `const cities = ${literal(cities)};`,
        controls: ['placeholder', 'filter', 'showClear', 'checkmark', 'loading', 'size', 'variant', 'invalid', 'disabled', 'fluid']
    },
    ToggleSwitch: { tag: 'ToggleSwitch', component: ToggleSwitch, model: true, props: { label: 'Alerts' }, controls: ['label', 'onLabel', 'offLabel', 'showStateLabel', 'invalid', 'disabled'] },
    Checkbox: { tag: 'Checkbox', component: Checkbox, model: true, props: { binary: true, label: 'Send me the summary' }, controls: ['label', 'size', 'invalid', 'disabled', 'readonly'] },
    Slider: { tag: 'Slider', component: Slider, model: 40, fixed: { ariaLabel: 'Volume' }, fixedCode: 'aria-label="Volume"', props: { min: 0, max: 100, step: 1 }, controls: ['min', 'max', 'step', 'orientation', 'disabled'] },
    Rating: { tag: 'Rating', component: Rating, model: 3, props: { stars: 5 }, controls: ['stars', 'clearable', 'readonly', 'disabled', 'invalid'] },
    ProgressBar: { tag: 'ProgressBar', component: ProgressBar, props: { value: 64 }, controls: ['value', 'mode', 'showValue', 'unit'] },
    Skeleton: { tag: 'Skeleton', component: Skeleton, props: { width: '12rem', height: '1.25rem' }, controls: ['shape', 'width', 'height', 'borderRadius', 'animated'] },
    DataGrid: {
        tag: 'DataGrid',
        component: DataGrid,
        wide: true,
        props: { stripedRows: true, showGridlines: true, minHeight: '14rem', fillRows: true },
        fixed: { value: orders, dataKey: 'id', ariaLabel: 'Orders' },
        fixedCode: ':value="orders" data-key="id" aria-label="Orders"',
        script: `const orders = [\n    { id: 1041, customer: 'Ana Souza', items: 3, total: 418.5 },\n    // …\n];`,
        controls: [
            'size',
            'stripedRows',
            'showGridlines',
            'resizableColumns',
            'reorderableColumns',
            'fillRows',
            'minHeight',
            'paginator',
            'paginatorPosition',
            'responsiveLayout',
            'breakpoint',
            'emptyInView',
            'scrollbarGutter'
        ],
        children: () => [
            h(Column, { field: 'id', header: 'Order', sortable: true, width: 110 }),
            h(Column, { field: 'customer', header: 'Customer', sortable: true }),
            h(Column, { field: 'items', header: 'Items', align: 'right', width: 100 }),
            h(Column, { field: 'total', header: 'Total', align: 'right', width: 120 })
        ],
        childrenCode: [
            '<Column field="id" header="Order" sortable :width="110" />',
            '<Column field="customer" header="Customer" sortable />',
            '<Column field="items" header="Items" align="right" :width="100" />',
            '<Column field="total" header="Total" align="right" :width="120" />'
        ].join('\n')
    },
    Taskboard: {
        tag: 'Taskboard',
        component: Taskboard,
        wide: true,
        props: { minHeight: '12rem' },
        models: board,
        controls: ['minHeight', 'emptyAt', 'collapsedTitleAt', 'placeholder', 'dragdrop', 'reorderColumns', 'collapsible', 'disabled']
    }
};

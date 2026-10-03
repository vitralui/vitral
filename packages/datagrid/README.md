# @vitral/datagrid

A data grid with no framework in it: the engine and a DOM renderer, which the
Vitral components wrap.

It draws a real `<table>` — one `<th scope="col">` a column, a button in the
header that carries the sort, native checkboxes and radios for selection, a
text box a column filters by — so a screen reader reads it as the table it is.

```ts
import { createDataGrid } from '@vitral/datagrid';

const table = createDataGrid(element, {
    value: people,
    dataKey: 'id',
    columns: [
        { field: 'name', header: 'Name', sortable: true },
        { field: 'city', header: 'City', sortable: true },
        { field: 'age', header: 'Age', align: 'right' }
    ],
    paginator: true,
    rows: 10,
    on: { change: (state) => save(state) }
});

table.update({ value: people });
table.destroy();
```

Sorting (single or multiple), filtering by column or across fields, paging,
single and multiple selection, lazy loading and data sources, columns the
reader resizes, moves, pins and hides, tables that share one column layout, and
a column layout that is plain data an application can store and hand back —
and `toCSV()` / `exportCSV()` to write what is on show (every filtered row,
the page, or the selection) as a file a spreadsheet opens safely.

Everything the reader can change is state the table keeps and publishes through
`change`, so a host can bind it. A cell, a header, a footer or a filter a host
wants to draw itself takes a function returning a string or a node, which is
how a framework component passes a slot through.

`@vitral/datagrid/engine` is the arithmetic on its own: which columns, in what
order and at what width; which rows, sorted, filtered and paged; what is
selected. No DOM, no timers.

The box the table scrolls in and the column list wear the theme's drawn scrollbars, the ScrollPanel's, over native
scrolling: `scrollbar: 'hover'` (the default) shows them under the pointer and
while scrolling, `'always'` keeps them on the screen, `'native'` gives the
browser's own back.

**[Documentation](https://vitralui.github.io/vitral/#/components/datagrid)**

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.

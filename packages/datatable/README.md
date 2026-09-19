# @vitral/datatable

A data table with no framework in it: the engine and a DOM renderer, which the
Vitral components wrap.

It draws a real `<table>` — one `<th scope="col">` a column, a button in the
header that carries the sort, native checkboxes and radios for selection, a
text box a column filters by — so a screen reader reads it as the table it is.

```ts
import { createDataTable } from '@vitral/datatable';

const table = createDataTable(element, {
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
a column layout that is plain data an application can store and hand back.

Everything the reader can change is state the table keeps and publishes through
`change`, so a host can bind it. A cell, a header, a footer or a filter a host
wants to draw itself takes a function returning a string or a node, which is
how a framework component passes a slot through.

`@vitral/datatable/engine` is the arithmetic on its own: which columns, in what
order and at what width; which rows, sorted, filtered and paged; what is
selected. No DOM, no timers.

**[Documentation](https://vitralui.github.io/vitral/#/components/datatable)**

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.

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

It scales and works as a spreadsheet does, with nothing to install:

- **Scale and layout**: virtual rows and virtual columns, column groups,
  rows pinned to the top or the bottom, fixed or automatic row heights.
- **Editing**: a cell or a whole row, an editor by value kind or of the
  host's own, `validate` and `parseValue`, Tab and Enter as in a sheet, and
  undo and redo.
- **Filters and menus**: a filter panel under each header (two conditions, or
  a list of values to tick), a column menu, and a menu on right click.
- **Rows**: groups inside groups with totals (`aggregate`), tree data, rows
  dragged into another order, and a status bar.
- **Cells**: a block of cells marked with the pointer or Shift; copy and paste
  that a spreadsheet understands; a fill handle that carries a series on;
  cells that flash when they change; and `exportExcel()`, a real `.xlsx` in
  which numbers stay numbers and dates stay dates.
- **Analysis**: `pivot` turns the rows about. `sideBar` adds panels to show,
  hide and reorder the columns, to hold every column's filter, and to build
  the pivot by dragging fields into rows, columns and values.

Each of these is off unless asked for, or can be turned off.

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

# @vitral/datagrid against AG Grid

What AG Grid (v36, Community and Enterprise) does, and whether the grid does it too.
Each line that is done has a spec that shows it; a line still open is the next work.

`done` it is there and tested · `part` some of it · `open` not yet

## Columns

| AG Grid | Here | |
|---|---|---|
| Column definitions, groups of headers | `columns`, `columns: [...]` nested | done |
| Sizing: drag, min width, fit modes | `resizableColumns`, `columnResizeMode`, `minWidth` | done |
| Flex widths (a share of the room left) | `flex` | done |
| Autosize a column / all columns | column menu | done |
| Moving by drag, by menu | `reorderableColumns`, column menu | done |
| Pinning left and right | `pinned`, column menu | done |
| Column spanning (`colSpan`) | `colSpan` by cell | done |
| Auto-generated columns from the data | | open |
| Calculated columns (a formula the reader writes) | | open |
| Header tooltips, header text wrap, auto header height | `description` (info button) | part |
| Column chooser, column state | side bar, drawer, `stateKey` | done |
| Column menu | `columnMenu`, with submenus | done |
| Default column definition | `columnDefaults` | done |

## Rows

| AG Grid | Here | |
|---|---|---|
| Row ids, pinned rows | `dataKey`, `pinnedTopRows`/`pinnedBottomRows` | done |
| Row height fixed, by content | `rowHeight`, auto | done |
| Row spanning (`rowSpan`) | `spanRows`: equal values, or a rule | done |
| Row class rules | `rowClass` | done |
| Full-width rows | group headings only | part |
| Row dragging, managed | `rowDrag` | done |
| Row dragging to another grid, to a drop zone | | open |
| Row numbers column | `rowNumbers`, `rowNumber` | done |
| Pagination, page size selector | `paginator`, `rowsPerPageOptions`, `PageInput` | done |
| Row animation (rows slide to their new place) | | open |

## Cells

| AG Grid | Here | |
|---|---|---|
| Cell renderers | `body`, Vue `#body` | done |
| Value getters | `valueGetter` | done |
| Value formatters (used by text, totals, set filter) | `valueFormatter` | done |
| Cell data types (number, date, boolean, text inferred) | filter and editor kind inferred | part |
| Cell class rules, cell style by value | `bodyClass`/`bodyStyle` as functions | done |
| Tooltips on cells | `tooltip` | done |
| Highlight changes (flash) | `flashCells` | done |
| Overlays: loading, no rows | `loading`, `loadingMode`, `emptyMessage` | done |
| Sparklines: line, area, column, bar, markers, tooltip | `sparkline` | done |

## Sorting and filtering

| AG Grid | Here | |
|---|---|---|
| Single and multiple sort | `sortMode` | done |
| Custom comparator | `comparator` | done |
| Text, number, date filters, conditions | `filter` | done |
| Set filter with labels, search | `filter: 'set'`, `filterOptions` | done |
| Set filter tree list, Excel mode | | open |
| Multi filter (set and condition together) | | open |
| Floating filters | `filterDisplay: 'row'` | done |
| Quick filter | `globalFilterFields` | done |
| External filter | `externalFilter` | done |
| Advanced filter (a builder of conditions) | | open |
| Filters tool panel | side bar `filters` | done |

## Selection, editing, clipboard

| AG Grid | Here | |
|---|---|---|
| Row selection, checkboxes, header checkbox | `selectionMode` | done |
| Group selects its rows | | open |
| Cell range selection, range handle | `cellSelection` | done |
| Fill handle | `fillHandle` | done |
| Clipboard copy and paste | `clipboard` | done |
| Text, number, date, checkbox editors | `editMode` | done |
| Large text, select, rich select editors | `editor` (own) | part |
| Full row editing, validation | `rowEditor`, `validate` | done |
| Undo / redo | `undoRedo` | done |
| Batch editing (keep edits, then save all) | | open |
| Find (search and step through matches) | | open |
| Cell notes | | open |
| Formulas in cells | | open |

## Grouping, aggregation, pivot, tree

| AG Grid | Here | |
|---|---|---|
| Row grouping, nested | `groupBy` | done |
| Group display: group rows | | done |
| Group display: single group column, multiple columns | | open |
| Row group panel (drag a column to group by it) | drawer, pivot panel | part |
| Aggregation: sum, min, max, count, avg, custom | `aggregate` | done |
| Aggregation: first, last | `aggregate: 'first' \| 'last'` | done |
| Show values as (percent of total, of row, of column) | | open |
| Total row, grand total | `totalRow` | done |
| Group footers | | open |
| Pivot, pivot totals, pivot panel | `pivot`, side bar `pivot` | done |
| Tree data | `treeData` | done |
| Master / detail | row expansion | done |

## Row models

| AG Grid | Here | |
|---|---|---|
| Client side | `value` | done |
| Server side: sort, filter, page | `dataSource`, `lazy` | done |
| Infinite scroll | `dataSource` + `virtualScroll` | part |
| Server side grouping and pivot | | open |

## Export, charts, panels

| AG Grid | Here | |
|---|---|---|
| CSV export | `exportCSV` | done |
| Excel export | `exportExcel` | done |
| Excel styles, several sheets | | open |
| PDF export, print layout | | open |
| Excel import | | open |
| Integrated charts from a range or the pivot | | open |
| Side bar: columns, filters, custom panel | `sideBar` | done |
| Status bar | `statusBar` | done |
| Context menu | `contextMenu` | done |

## Everything else

| AG Grid | Here | |
|---|---|---|
| Row and column virtualisation | `virtualScroll`, `virtualColumns` | done |
| Keyboard navigation, ARIA | | done |
| RTL | | done |
| Themes, density | presets, `size` | done |
| Localisation | `locale` | done |
| Grid state save and restore | `stateKey`, `state()` | done |
| Aligned grids (two grids share columns and scroll) | `group` | part |
| Data dictionary | `dictionary` | (AG Grid has none) |

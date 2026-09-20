/**
 * `@vitral/datagrid`: a data grid with no framework in it — everything a table
 * of data grows into once it is doing real work: sorting, filtering, paging,
 * selection, resizable and reorderable columns, frozen columns and rows,
 * editing and the keyboard that goes with all of it. Vue's `<DataTable>` is
 * the small one, for when a page only needs rows on screen.
 *
 * - the engine: which columns, in what order and at what width; which rows,
 *   sorted, filtered and paged; and what is selected (also at
 *   `@vitral/datagrid/engine`);
 * - `createDataGrid()`: a DOM renderer with sorting, filtering, paging,
 *   selection, the column tools and the keyboard, which the framework
 *   components wrap;
 * - the classes and tokens are `@vitral/styles`' `datagridStyle`, so a table
 *   follows whatever preset the page is themed with.
 */
export * from './engine/index';
export { createDataGrid, type DataGridHandle } from './grid';
export { iconView, gridView, type DataGridActions, type ViewContext } from './render/grid';

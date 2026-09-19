/**
 * `@vitral/datatable`: a data table with no framework in it.
 *
 * - the engine: which columns, in what order and at what width; which rows,
 *   sorted, filtered and paged; and what is selected (also at
 *   `@vitral/datatable/engine`);
 * - `createDataTable()`: a DOM renderer with sorting, filtering, paging,
 *   selection, the column tools and the keyboard, which the framework
 *   components wrap;
 * - the classes and tokens are `@vitral/styles`' `datatableStyle`, so a table
 *   follows whatever preset the page is themed with.
 */
export * from './engine/index';
export { createDataTable, type TableHandle } from './table';
export { iconView, tableView, type TableActions, type ViewContext } from './render/table';

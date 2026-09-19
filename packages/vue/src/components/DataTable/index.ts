import Column from './Column.vue';
import DataTableVue from './DataTable.vue';
import { DataTableEmpty, DataTableFooter, DataTableHeader, DataTableLoadingIcon, DataTablePaginatorEnd, DataTablePaginatorStart } from './parts';

/**
 * The table, and as properties the parts a template composes it from:
 * `<DataTable.Column>`, `<DataTable.Header>`, `<DataTable.Empty>`… `Root` is
 * the table itself, for a template that would rather name every part. Each
 * part is also a named export (`Column`, `DataTableHeader`…).
 */
export const DataTable = /* @__PURE__ */ Object.assign(DataTableVue, {
    Root: DataTableVue,
    Column,
    Header: DataTableHeader,
    Footer: DataTableFooter,
    Empty: DataTableEmpty,
    LoadingIcon: DataTableLoadingIcon,
    PaginatorStart: DataTablePaginatorStart,
    PaginatorEnd: DataTablePaginatorEnd
});

export { Column, DataTableHeader, DataTableFooter, DataTableEmpty, DataTableLoadingIcon, DataTablePaginatorStart, DataTablePaginatorEnd };
export type * from './types';

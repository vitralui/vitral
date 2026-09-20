import Column from './Column.vue';
import DataGridVue from './DataGrid.vue';
import { DataGridEmpty, DataGridFooter, DataGridHeader, DataGridLoadingIcon, DataGridPaginatorEnd, DataGridPaginatorStart } from './parts';

/**
 * The table, and as properties the parts a template composes it from:
 * `<DataGrid.Column>`, `<DataGrid.Header>`, `<DataGrid.Empty>`… `Root` is
 * the table itself, for a template that would rather name every part. Each
 * part is also a named export (`Column`, `DataGridHeader`…).
 */
export const DataGrid = /* @__PURE__ */ Object.assign(DataGridVue, {
    Root: DataGridVue,
    Column,
    Header: DataGridHeader,
    Footer: DataGridFooter,
    Empty: DataGridEmpty,
    LoadingIcon: DataGridLoadingIcon,
    PaginatorStart: DataGridPaginatorStart,
    PaginatorEnd: DataGridPaginatorEnd
});

export { Column, DataGridHeader, DataGridFooter, DataGridEmpty, DataGridLoadingIcon, DataGridPaginatorStart, DataGridPaginatorEnd };
export type * from './types';

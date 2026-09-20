import { definePart } from '../../base/parts';

/**
 * The table's content, written as children rather than as named slots:
 * `<DataGrid.Header>`, `<DataGrid.Empty>`, `<DataGrid.PaginatorStart>`…
 * Each draws nothing itself — the table takes what is inside it and places it
 * where that part belongs. The named slots do the same thing and win where a
 * template gives both.
 */
export const DataGridHeader = definePart('Header', 'VtDataGridHeader');
export const DataGridFooter = definePart('Footer', 'VtDataGridFooter');
export const DataGridEmpty = definePart('Empty', 'VtDataGridEmpty');
export const DataGridLoadingIcon = definePart('LoadingIcon', 'VtDataGridLoadingIcon');
export const DataGridPaginatorStart = definePart('PaginatorStart', 'VtDataGridPaginatorStart');
export const DataGridPaginatorEnd = definePart('PaginatorEnd', 'VtDataGridPaginatorEnd');

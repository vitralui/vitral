import { definePart } from '../../base/parts';

/**
 * The table's content, written as children rather than as named slots:
 * `<DataTable.Header>`, `<DataTable.Empty>`. Each draws nothing itself — the
 * table takes what is inside it and places it where that part belongs. The
 * named slots do the same thing and win where a template gives both.
 */
export const DataTableHeader = definePart('Header', 'VtDataTableHeader');
export const DataTableFooter = definePart('Footer', 'VtDataTableFooter');
export const DataTableEmpty = definePart('Empty', 'VtDataTableEmpty');

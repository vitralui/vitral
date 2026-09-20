import Column from './Column.vue';
import DataTableVue from './DataTable.vue';
import { DataTableEmpty, DataTableFooter, DataTableHeader } from './parts';

/**
 * The small table, and as properties the parts a template composes it from:
 * `<DataTable.Column>`, `<DataTable.Header>`, `<DataTable.Empty>`. `Root` is
 * the table itself, for a template that would rather name every part.
 */
export const DataTable = /* @__PURE__ */ Object.assign(DataTableVue, {
    Root: DataTableVue,
    Column,
    Header: DataTableHeader,
    Footer: DataTableFooter,
    Empty: DataTableEmpty
});

export { Column as DataTableColumn, DataTableHeader, DataTableFooter, DataTableEmpty };
export type * from './types';

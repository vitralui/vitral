import { defineStyle } from '../defineStyle';
import css from './datatable.css?raw';

export interface DataTableState {
    striped?: boolean;
    gridlines?: boolean;
    size?: 'small' | 'large';
    scrollable?: boolean;
}

const align = (s: { align?: string }) => ({ 'vt-datatable-align-center': s.align === 'center', 'vt-datatable-align-right': s.align === 'right' });

/**
 * The small table's classes. The heavy one — paging, filters, selection,
 * columns the reader moves, freezes and resizes — is `datagridStyle`.
 */
export const datatableStyle = defineStyle({
    name: 'datatable',
    css,
    classes: {
        root: (s: DataTableState) => [
            'vt-datatable',
            {
                'vt-datatable-striped': s.striped,
                'vt-datatable-gridlines': s.gridlines,
                'vt-datatable-sm': s.size === 'small',
                'vt-datatable-lg': s.size === 'large',
                'vt-datatable-scrollable': s.scrollable
            }
        ],
        header: 'vt-datatable-header',
        footer: 'vt-datatable-footer',
        tableContainer: 'vt-datatable-table-container',
        table: 'vt-datatable-table',
        caption: 'vt-sr-only',
        thead: 'vt-datatable-thead',
        headerRow: 'vt-datatable-header-row',
        headerCell: (s: { align?: string; sorted?: boolean }) => ['vt-datatable-header-cell', align(s), { 'vt-datatable-header-cell-sorted': s.sorted }],
        sortButton: 'vt-datatable-sort-button',
        sortIcon: (s: { active?: boolean }) => ['vt-datatable-sort-icon', { 'vt-datatable-sort-icon-active': s.active }],
        tbody: 'vt-datatable-tbody',
        row: (s: { hoverable?: boolean }) => ['vt-datatable-row', { 'vt-datatable-row-hoverable': s.hoverable }],
        bodyCell: (s: { align?: string }) => ['vt-datatable-body-cell', align(s)],
        emptyCell: 'vt-datatable-empty-cell'
    }
});

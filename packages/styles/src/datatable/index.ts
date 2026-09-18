import { defineStyle } from '../defineStyle';
import css from './datatable.css?raw';

export interface DataTableState {
    striped?: boolean;
    gridlines?: boolean;
    size?: 'small' | 'large';
    scrollable?: boolean;
    flexScroll?: boolean;
    loading?: boolean;
}

export interface DataTableCellState {
    align?: 'left' | 'center' | 'right';
    /** Stuck to an edge while the rest of the table scrolls. */
    pinned?: 'left' | 'right';
    /** The last pinned column on its side: the one that casts the shadow. */
    pinnedEdge?: boolean;
}

export interface DataTableHeaderCellState extends DataTableCellState {
    sortable?: boolean;
    sorted?: boolean;
    /** This header is being dragged to another place. */
    dragging?: boolean;
    /** A dragged column would land before this one. */
    dropping?: boolean;
}

export interface DataTableRowState {
    selectable?: boolean;
    selected?: boolean;
}

const align = (s: DataTableCellState) => ({ 'vt-datatable-align-center': s.align === 'center', 'vt-datatable-align-right': s.align === 'right' });
const pinned = (s: DataTableCellState) => ({
    'vt-datatable-pinned': !!s.pinned,
    'vt-datatable-pinned-left': s.pinned === 'left',
    'vt-datatable-pinned-right': s.pinned === 'right',
    'vt-datatable-pinned-edge': s.pinnedEdge
});

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
                'vt-datatable-scrollable': s.scrollable,
                'vt-datatable-loading': s.loading
            }
        ],
        header: 'vt-datatable-header',
        footer: 'vt-datatable-footer',
        tableContainer: (s: DataTableState) => ['vt-datatable-table-container', { 'vt-datatable-flex-scroll': s.flexScroll }],
        table: 'vt-datatable-table',
        caption: 'vt-datatable-caption',
        hiddenCaption: 'vt-sr-only',
        thead: 'vt-datatable-thead',
        headerRow: 'vt-datatable-header-row',
        headerCell: (s: DataTableHeaderCellState) => [
            'vt-datatable-header-cell',
            { 'vt-datatable-header-cell-sortable': s.sortable, 'vt-datatable-header-cell-sorted': s.sorted, 'vt-datatable-dragging': s.dragging, 'vt-datatable-dropping': s.dropping },
            align(s),
            pinned(s)
        ],
        resizer: 'vt-datatable-resizer',
        chooserButton: 'vt-datatable-chooser-button',
        chooserList: 'vt-datatable-chooser-list',
        chooserItem: 'vt-datatable-chooser-item',
        chooserLabel: 'vt-datatable-chooser-label',
        chooserCheckbox: 'vt-datatable-chooser-checkbox',
        headerTitle: 'vt-datatable-header-title',
        sortButton: 'vt-datatable-sort-button',
        sortIcon: (s: { active?: boolean }) => ['vt-datatable-sort-icon', s.active ? 'vt-datatable-sort-icon-active' : 'vt-datatable-sort-icon-idle'],
        sortBadge: 'vt-datatable-sort-badge',
        sortStatus: 'vt-sr-only',
        filterRow: 'vt-datatable-filter-row',
        filterCell: (s: DataTableCellState) => ['vt-datatable-filter-cell', align(s), pinned(s)],
        filterInput: 'vt-datatable-filter-input',
        tbody: 'vt-datatable-tbody',
        row: (s: DataTableRowState) => ['vt-datatable-row', { 'vt-datatable-row-selectable': s.selectable, 'vt-datatable-row-selected': s.selected }],
        bodyCell: (s: DataTableCellState) => ['vt-datatable-body-cell', align(s), pinned(s)],
        selectionCell: 'vt-datatable-selection-cell',
        checkbox: 'vt-datatable-checkbox',
        checkboxInput: 'vt-datatable-checkbox-input',
        checkboxIcon: 'vt-datatable-checkbox-icon',
        emptyRow: 'vt-datatable-empty-row',
        emptyCell: 'vt-datatable-empty-cell',
        tfoot: 'vt-datatable-tfoot',
        footerRow: 'vt-datatable-footer-row',
        footerCell: (s: DataTableCellState) => ['vt-datatable-footer-cell', align(s), pinned(s)],
        paginator: (s: { position?: 'top' | 'bottom' }) => ['vt-datatable-paginator', { 'vt-datatable-paginator-top': s.position === 'top' }],
        loadingMask: 'vt-datatable-loading-mask',
        loadingIcon: 'vt-datatable-loading-icon',
        loadingText: 'vt-sr-only',
        selectionHeaderText: 'vt-sr-only'
    }
});

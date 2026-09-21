import { defineStyle } from '../defineStyle';
import css from './datagrid.css?raw';

export interface DataGridState {
    striped?: boolean;
    gridlines?: boolean;
    size?: 'small' | 'large';
    scrollable?: boolean;
    flexScroll?: boolean;
    loading?: boolean;
}

export interface DataGridCellState {
    align?: 'left' | 'center' | 'right';
    /** Stuck to an edge while the rest of the table scrolls. */
    pinned?: 'left' | 'right';
    /** The last pinned column on its side: the one that casts the shadow. */
    pinnedEdge?: boolean;
}

export interface DataGridHeaderCellState extends DataGridCellState {
    sortable?: boolean;
    sorted?: boolean;
    /** This header is being dragged to another place. */
    dragging?: boolean;
    /** A dragged column would land before this one. */
    dropping?: boolean;
}

export interface DataGridRowState {
    selectable?: boolean;
    selected?: boolean;
}

const align = (s: DataGridCellState) => ({ 'vt-datagrid-align-center': s.align === 'center', 'vt-datagrid-align-right': s.align === 'right' });
const pinned = (s: DataGridCellState) => ({
    'vt-datagrid-pinned': !!s.pinned,
    'vt-datagrid-pinned-left': s.pinned === 'left',
    'vt-datagrid-pinned-right': s.pinned === 'right',
    'vt-datagrid-pinned-edge': s.pinnedEdge
});

export const datagridStyle = defineStyle({
    name: 'datagrid',
    css,
    classes: {
        root: (s: DataGridState) => [
            'vt-datagrid',
            {
                'vt-datagrid-striped': s.striped,
                'vt-datagrid-gridlines': s.gridlines,
                'vt-datagrid-sm': s.size === 'small',
                'vt-datagrid-lg': s.size === 'large',
                'vt-datagrid-scrollable': s.scrollable,
                'vt-datagrid-loading': s.loading
            }
        ],
        header: 'vt-datagrid-header',
        footer: 'vt-datagrid-footer',
        tableContainer: (s: DataGridState) => ['vt-datagrid-table-container', { 'vt-datagrid-flex-scroll': s.flexScroll }],
        table: 'vt-datagrid-table',
        caption: 'vt-datagrid-caption',
        hiddenCaption: 'vt-sr-only',
        thead: 'vt-datagrid-thead',
        headerRow: 'vt-datagrid-header-row',
        headerCell: (s: DataGridHeaderCellState) => [
            'vt-datagrid-header-cell',
            { 'vt-datagrid-header-cell-sortable': s.sortable, 'vt-datagrid-header-cell-sorted': s.sorted, 'vt-datagrid-dragging': s.dragging, 'vt-datagrid-dropping': s.dropping },
            align(s),
            pinned(s)
        ],
        resizer: 'vt-datagrid-resizer',
        chooserButton: 'vt-datagrid-chooser-button',
        /** The panel the list sits in, where the table draws it itself rather than in a popover. */
        chooserPanel: 'vt-datagrid-chooser-panel',
        chooserList: 'vt-datagrid-chooser-list',
        chooserItem: 'vt-datagrid-chooser-item',
        chooserLabel: 'vt-datagrid-chooser-label',
        chooserCheckbox: 'vt-datagrid-chooser-checkbox',
        headerTitle: 'vt-datagrid-header-title',
        sortButton: 'vt-datagrid-sort-button',
        sortIcon: (s: { active?: boolean }) => ['vt-datagrid-sort-icon', s.active ? 'vt-datagrid-sort-icon-active' : 'vt-datagrid-sort-icon-idle'],
        sortBadge: 'vt-datagrid-sort-badge',
        sortStatus: 'vt-sr-only',
        filterRow: 'vt-datagrid-filter-row',
        filterCell: (s: DataGridCellState) => ['vt-datagrid-filter-cell', align(s), pinned(s)],
        /**
         * Around the filter box, where the table draws the box itself rather
         * than an input component: the shared field classes, so it is the same
         * box either way.
         */
        filterField: 'vt-field vt-field-sm vt-field-fluid vt-datagrid-filter-field',
        filterInput: 'vt-datagrid-filter-input',
        tbody: 'vt-datagrid-tbody',
        row: (s: DataGridRowState) => ['vt-datagrid-row', { 'vt-datagrid-row-selectable': s.selectable, 'vt-datagrid-row-selected': s.selected }],
        bodyCell: (s: DataGridCellState) => ['vt-datagrid-body-cell', align(s), pinned(s)],
        selectionCell: 'vt-datagrid-selection-cell',
        checkbox: 'vt-datagrid-checkbox',
        checkboxInput: 'vt-datagrid-checkbox-input',
        checkboxIcon: 'vt-datagrid-checkbox-icon',
        /** The heading over a run of rows that share the grouping field. */
        groupRow: 'vt-datagrid-group-row',
        groupCell: 'vt-datagrid-group-cell',
        groupToggle: 'vt-datagrid-group-toggle',
        groupIcon: (s: { collapsed?: boolean }) => ['vt-datagrid-group-icon', { 'vt-datagrid-group-icon-collapsed': s.collapsed }],
        groupTitle: 'vt-datagrid-group-title',
        groupCount: 'vt-datagrid-group-count',
        emptyRow: 'vt-datagrid-empty-row',
        emptyCell: 'vt-datagrid-empty-cell',
        tfoot: 'vt-datagrid-tfoot',
        footerRow: 'vt-datagrid-footer-row',
        footerCell: (s: DataGridCellState) => ['vt-datagrid-footer-cell', align(s), pinned(s)],
        paginator: (s: { position?: 'top' | 'bottom' }) => ['vt-datagrid-paginator', { 'vt-datagrid-paginator-top': s.position === 'top' }],
        loadingMask: 'vt-datagrid-loading-mask',
        loadingIcon: 'vt-datagrid-loading-icon',
        loadingText: 'vt-sr-only',
        selectionHeaderText: 'vt-sr-only'
    }
});

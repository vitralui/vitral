import { defineStyle } from '../defineStyle';
import css from './datagrid.css?raw';

export interface DataGridState {
    /** The room under the rows goes on as empty rows. */
    fillRows?: boolean;
    /** The rows are cards of labelled cells. */
    stacked?: boolean;
    striped?: boolean;
    gridlines?: boolean;
    size?: 'small' | 'large';
    scrollable?: boolean;
    flexScroll?: boolean;
    loading?: boolean;
    /** Every row one height (`rowHeight`), its cells kept to one line. */
    fixedRows?: boolean;
    /** A header's menu button shows only while the header is pointed at. */
    toolsOnHover?: boolean;
    /** Columns are scrolled under the pinned ones at the start, whose edge then casts its shadow. */
    underStart?: boolean;
    /** Columns are scrolled under the pinned ones at the end. */
    underEnd?: boolean;
}

export interface DataGridCellState {
    align?: 'left' | 'center' | 'right';
    /** Stuck to an edge while the rest of the table scrolls. */
    pinned?: 'left' | 'right';
    /** The last pinned column on its side: the one that casts the shadow. */
    pinnedEdge?: boolean;
}

export interface DataGridBodyCellState extends DataGridCellState {
    /** Its editor is open. */
    editing?: boolean;
    /** The reader may edit it. */
    editable?: boolean;
    /** It is in the block of cells marked, and on which of the block's edges. */
    inRange?: boolean;
    rangeTop?: boolean;
    rangeBottom?: boolean;
    rangeStart?: boolean;
    rangeEnd?: boolean;
    /** The fill handle, dragged, would write it. */
    fillTarget?: boolean;
}

export interface DataGridHeaderCellState extends DataGridCellState {
    sortable?: boolean;
    sorted?: boolean;
    /** This header is being dragged to another place. */
    dragging?: boolean;
    /** A dragged column would land before this one. */
    dropping?: boolean;
    /** Its buttons sit right after the title rather than at the column's edge. */
    toolsAtTitle?: boolean;
}

export interface DataGridRowState {
    selectable?: boolean;
    selected?: boolean;
    /** A placeholder row, drawn while the table loads as `skeleton`. */
    skeleton?: boolean;
    /** Its detail is open under it. */
    expanded?: boolean;
    /** It is being dragged by its handle. */
    dragging?: boolean;
    /** A dragged row would land before it, or after it. */
    dropBefore?: boolean;
    dropAfter?: boolean;
}

export interface DataGridSkeletonState {
    /** The box a selection control will be, instead of a bar of text. */
    box?: boolean;
    /** That box is a radio's. */
    round?: boolean;
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
                'vt-datagrid-loading': s.loading,
                'vt-datagrid-fixed-rows': s.fixedRows,
                'vt-datagrid-tools-on-hover': s.toolsOnHover,
                'vt-datagrid-stacked': s.stacked,
                'vt-datagrid-under-start': s.underStart,
                'vt-datagrid-under-end': s.underEnd
            }
        ],
        header: 'vt-datagrid-header',
        footer: 'vt-datagrid-footer',
        /**
         * The columns drawer, in the Drawer's, ToggleSwitch's and Button's own
         * classes, so a theme that dresses those dresses it.
         */
        drawerMask: 'vt-mask vt-drawer-mask vt-drawer-mask-right vt-datagrid-drawer-mask',
        drawer: 'vt-drawer vt-drawer-right vt-datagrid-drawer',
        drawerHeader: 'vt-drawer-header',
        drawerTitle: 'vt-drawer-title',
        drawerClose: 'vt-drawer-close-button',
        drawerContent: 'vt-drawer-content vt-datagrid-drawer-content',
        drawerFooter: 'vt-drawer-footer vt-datagrid-drawer-footer',
        drawerTabs: 'vt-datagrid-drawer-tabs',
        drawerTab: (s: { active?: boolean }) => ['vt-datagrid-drawer-tab', { 'vt-datagrid-drawer-tab-active': s.active }],
        drawerHelp: 'vt-datagrid-drawer-help',
        drawerAll: 'vt-datagrid-drawer-all',
        drawerCards: 'vt-datagrid-drawer-cards',
        drawerCard: (s: { dragging?: boolean; dropping?: boolean }) => ['vt-datagrid-drawer-card', { 'vt-datagrid-drawer-card-dragging': s.dragging, 'vt-datagrid-drawer-card-drop': s.dropping }],
        drawerCardTitle: 'vt-datagrid-drawer-card-title',
        drawerHandle: 'vt-datagrid-drawer-handle',
        drawerSwitch: (s: { checked?: boolean }) => ['vt-toggleswitch', 'vt-datagrid-drawer-switch', { 'vt-toggleswitch-checked': s.checked }],
        drawerSwitchTrack: 'vt-toggleswitch-track',
        drawerSwitchInput: 'vt-toggleswitch-input',
        drawerSwitchKnob: 'vt-toggleswitch-knob',
        drawerFields: 'vt-datagrid-drawer-fields',
        drawerField: 'vt-datagrid-drawer-field',
        drawerFieldLabel: 'vt-datagrid-drawer-field-label',
        drawerSelect: 'vt-datagrid-drawer-select',
        drawerGroups: 'vt-datagrid-drawer-groups',
        drawerGroupsTitle: 'vt-datagrid-drawer-groups-title',
        drawerChips: 'vt-datagrid-drawer-chips',
        drawerChip: 'vt-datagrid-drawer-chip',
        drawerEmpty: 'vt-datagrid-drawer-empty',
        drawerTools: 'vt-datagrid-drawer-tools',
        drawerTable: 'vt-datagrid-drawer-table',
        drawerButton: (s: { variant?: 'outlined' | 'text' }) => ['vt-button', s.variant && `vt-button-${s.variant}`, s.variant && 'vt-button-secondary'],
        /** The row at the foot with each column's value worked out over every row. */
        totalRow: 'vt-datagrid-total-row',
        tableContainer: (s: DataGridState) => ['vt-datagrid-table-container', { 'vt-datagrid-flex-scroll': s.flexScroll, 'vt-datagrid-table-container-fill': s.fillRows }],
        /** `sized`: laid out by the columns' widths (after a resize), each cell kept to its column. */
        table: (s: { sized?: boolean }) => ['vt-datagrid-table', { 'vt-datagrid-table-sized': s.sized }],
        caption: 'vt-datagrid-caption',
        hiddenCaption: 'vt-sr-only',
        thead: 'vt-datagrid-thead',
        headerRow: 'vt-datagrid-header-row',
        headerCell: (s: DataGridHeaderCellState) => [
            'vt-datagrid-header-cell',
            {
                'vt-datagrid-header-cell-sortable': s.sortable,
                'vt-datagrid-header-cell-sorted': s.sorted,
                'vt-datagrid-dragging': s.dragging,
                'vt-datagrid-dropping': s.dropping,
                'vt-datagrid-header-tools-at-title': s.toolsAtTitle
            },
            align(s),
            pinned(s)
        ],
        /** A row of the headings of groups of columns, over the columns' own. */
        columnGroupRow: 'vt-datagrid-column-group-row',
        /** A group's heading, across the run of its columns. */
        columnGroupCell: (s: DataGridCellState) => ['vt-datagrid-header-cell', 'vt-datagrid-column-group-cell', align(s), pinned(s)],
        /** The room over a column in fewer groups than the deepest, in a row of groups' headings. */
        blankHeaderCell: 'vt-datagrid-blank-header-cell',
        /** `resizing`: its edge is being dragged — the line stays lit, in the header only. */
        resizer: (s: { resizing?: boolean }) => ['vt-datagrid-resizer', { 'vt-datagrid-resizing': s.resizing }],
        chooserButton: 'vt-datagrid-chooser-button',
        /** The panel the list sits in, where the table draws it itself rather than in a popover. */
        chooserPanel: 'vt-datagrid-chooser-panel',
        chooserList: 'vt-datagrid-chooser-list',
        chooserItem: 'vt-datagrid-chooser-item',
        chooserLabel: 'vt-datagrid-chooser-label',
        chooserCheckbox: 'vt-datagrid-chooser-checkbox',
        headerTitle: 'vt-datagrid-header-title',
        /** The empty column after the last, while the widths lay the table out: it takes the room left. */
        fillerCell: 'vt-datagrid-filler-cell',
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
        /** The empty rows under the last one, down to the box's foot; `odd`: the rows above are an odd count, so the first empty one is striped. */
        fillRows: (s: { odd?: boolean }) => ['vt-datagrid-fill-rows', { 'vt-datagrid-fill-rows-odd': s.odd }],
        fillRow: 'vt-datagrid-fill-row',
        fillCell: 'vt-datagrid-fill-cell',
        row: (s: DataGridRowState) => [
            'vt-datagrid-row',
            {
                'vt-datagrid-row-selectable': s.selectable,
                'vt-datagrid-row-selected': s.selected,
                'vt-datagrid-row-skeleton': s.skeleton,
                'vt-datagrid-row-expanded': s.expanded,
                'vt-datagrid-row-dragging': s.dragging,
                'vt-datagrid-row-drop-before': s.dropBefore,
                'vt-datagrid-row-drop-after': s.dropAfter
            }
        ],
        expander: (s: { expanded?: boolean }) => ['vt-datagrid-expander', { 'vt-datagrid-expander-expanded': s.expanded }],
        expanderIcon: (s: { expanded?: boolean }) => ['vt-datagrid-expander-icon', { 'vt-datagrid-expander-icon-expanded': s.expanded }],
        expansionRow: 'vt-datagrid-expansion-row',
        expansionCell: 'vt-datagrid-expansion-cell',
        /** The room the rows out of view would take, in a virtual grid. */
        spacerRow: 'vt-datagrid-spacer-row',
        spacerCell: 'vt-datagrid-spacer-cell',
        /** A row held at the top or the bottom while the rest scroll. */
        pinnedRow: (s: { position?: 'top' | 'bottom' }) => ['vt-datagrid-pinned-row', { 'vt-datagrid-pinned-row-top': s.position === 'top', 'vt-datagrid-pinned-row-bottom': s.position === 'bottom' }],
        pinnedRowCell: 'vt-datagrid-pinned-row-cell',
        /** A run of one value down a column (`spanRows`), drawn once over every row of it from the top one. */
        rowRun: 'vt-datagrid-row-run',
        /** The run's value, kept to the part of the run in view as the grid scrolls. */
        rowRunValue: (s: { sticky?: boolean }) => ['vt-datagrid-row-run-value', { 'vt-datagrid-row-run-value-sticky': s.sticky }],
        bodyCell: (s: DataGridBodyCellState) => [
            'vt-datagrid-body-cell',
            align(s),
            pinned(s),
            {
                'vt-datagrid-cell-editing': s.editing,
                'vt-datagrid-cell-editable': s.editable,
                'vt-datagrid-cell-in-range': s.inRange,
                'vt-datagrid-cell-range-top': s.rangeTop,
                'vt-datagrid-cell-range-bottom': s.rangeBottom,
                'vt-datagrid-cell-range-start': s.rangeStart,
                'vt-datagrid-cell-range-end': s.rangeEnd,
                'vt-datagrid-cell-fill-target': s.fillTarget
            }
        ],
        /** The square at the marked block's corner that carries its values on. */
        fillHandle: 'vt-datagrid-fill-handle',
        /** The box a cell is edited in, where the grid draws it: the shared field classes, as the filter box. */
        editorField: (s: { invalid?: boolean }) => ['vt-field vt-field-sm vt-field-fluid vt-datagrid-editor-field', { 'vt-field-invalid': s.invalid }],
        editorInput: 'vt-datagrid-editor-input',
        /** Why a value was refused, under its editor. */
        editorError: 'vt-datagrid-editor-error',
        /** The buttons that edit a row as a whole. */
        rowEditor: 'vt-datagrid-row-editor',
        rowEditorButton: (s: { action?: string }) => ['vt-datagrid-row-editor-button', s.action ? `vt-datagrid-row-editor-${s.action}` : ''],
        /** Says an undo or a redo to a screen reader. */
        announcer: 'vt-sr-only',
        /** A header's buttons besides its title: the filter panel's and the column menu's. */
        /** A header's title and its buttons, on one line. */
        headerContent: 'vt-datagrid-header-content',
        headerTools: 'vt-datagrid-header-tools',
        headerToolButton: (s: { kind?: string; active?: boolean; open?: boolean }) => [
            'vt-datagrid-header-tool',
            s.kind ? `vt-datagrid-header-tool-${s.kind}` : '',
            { 'vt-datagrid-header-tool-active': s.active, 'vt-datagrid-header-tool-open': s.open }
        ],
        /** A column's filter panel, where the grid draws it: a card from the header's button. */
        filterPanel: (s: { kind?: string; inline?: boolean }) => ['vt-datagrid-filter-panel', s.kind ? `vt-datagrid-filter-panel-${s.kind}` : '', { 'vt-datagrid-filter-panel-inline': s.inline }],
        filterPanelBody: 'vt-datagrid-filter-panel-body',
        filterCondition: 'vt-datagrid-filter-condition',
        filterOperator: 'vt-datagrid-filter-operator',
        filterOperatorOption: 'vt-datagrid-filter-operator-option',
        filterValues: 'vt-datagrid-filter-values',
        filterValue: (s: { all?: boolean }) => ['vt-datagrid-filter-value', { 'vt-datagrid-filter-value-all': s.all }],
        filterMore: 'vt-datagrid-filter-more',
        filterPanelFooter: 'vt-datagrid-filter-panel-footer',
        filterClear: 'vt-datagrid-filter-clear',
        selectionCell: 'vt-datagrid-selection-cell',
        checkbox: 'vt-datagrid-checkbox',
        checkboxInput: 'vt-datagrid-checkbox-input',
        checkboxIcon: 'vt-datagrid-checkbox-icon',
        /** The heading over a run of rows that share the grouping field. */
        groupRow: (s: { values?: boolean }) => ['vt-datagrid-group-row', { 'vt-datagrid-group-row-values': s.values }],
        groupCell: (s: DataGridCellState & { level?: number; lead?: boolean }) => [
            'vt-datagrid-group-cell',
            align(s),
            pinned(s),
            { 'vt-datagrid-group-cell-nested': !!s.level, 'vt-datagrid-group-cell-lead': s.lead }
        ],
        /** A value worked out over a group's rows, beside its title. */
        groupAggregate: 'vt-datagrid-group-aggregate',
        /** A row of a tree's first cell: the indentation, the toggle, the content. */
        treeCell: 'vt-datagrid-tree-cell',
        treeToggle: (s: { expanded?: boolean }) => ['vt-datagrid-tree-toggle', { 'vt-datagrid-tree-toggle-expanded': s.expanded }],
        treeIcon: (s: { expanded?: boolean }) => ['vt-datagrid-tree-icon', { 'vt-datagrid-tree-icon-expanded': s.expanded }],
        treeSpacer: 'vt-datagrid-tree-spacer',
        treeContent: 'vt-datagrid-tree-content',
        /** The handle a row is dragged by. */
        rowDragHandle: 'vt-datagrid-row-drag-handle',
        /** The table and the side bar beside it. */
        /** The table and the side bar side by side; `flexScroll`: it takes the grid's height, as the table would. */
        bodyArea: (s: { flexScroll?: boolean }) => ['vt-datagrid-body-area', { 'vt-datagrid-body-area-flex': s.flexScroll }],
        /** The side bar: its tabs down the edge, the panel open, and what the panels hold. */
        sideBar: (s: { open?: boolean }) => ['vt-datagrid-side-bar', { 'vt-datagrid-side-bar-open': s.open }],
        sideTabs: 'vt-datagrid-side-tabs',
        sideTab: (s: { open?: boolean }) => ['vt-datagrid-side-tab', { 'vt-datagrid-side-tab-open': s.open }],
        sideTabIcon: 'vt-datagrid-side-tab-icon',
        sideTabLabel: 'vt-datagrid-side-tab-label',
        sidePanel: (s: { panel?: string }) => ['vt-datagrid-side-panel', s.panel ? `vt-datagrid-side-panel-${s.panel}` : ''],
        /** What stays at the top of a side panel while the rest of it scrolls: a search, a switch. */
        sidePanelHead: 'vt-datagrid-side-panel-head',
        sideColumns: 'vt-datagrid-side-columns',
        sideColumn: (s: { dragging?: boolean; dropping?: boolean }) => ['vt-datagrid-side-column', { 'vt-datagrid-side-column-dragging': s.dragging, 'vt-datagrid-side-column-drop': s.dropping }],
        sideColumnHandle: 'vt-datagrid-side-column-handle',
        sideFilter: (s: { open?: boolean; active?: boolean }) => ['vt-datagrid-side-filter', { 'vt-datagrid-side-filter-open': s.open, 'vt-datagrid-side-filter-active': s.active }],
        sideFilterToggle: 'vt-datagrid-side-filter-toggle',
        sideFilterIcon: (s: { open?: boolean }) => ['vt-datagrid-side-filter-icon', { 'vt-datagrid-side-filter-icon-open': s.open }],
        sideFilterLabel: 'vt-datagrid-side-filter-label',
        sideFilterActive: 'vt-datagrid-side-filter-active',
        /** The pivot panel: its places, the fields in them, and what a place says while empty. */
        pivotZone: (s: { zone?: string; dropping?: boolean }) => ['vt-datagrid-pivot-zone', s.zone ? `vt-datagrid-pivot-zone-${s.zone}` : '', { 'vt-datagrid-pivot-zone-drop': s.dropping }],
        pivotZoneTitle: 'vt-datagrid-pivot-zone-title',
        pivotZoneList: 'vt-datagrid-pivot-zone-list',
        pivotItem: (s: { dragging?: boolean; dropping?: boolean }) => ['vt-datagrid-pivot-item', { 'vt-datagrid-pivot-item-dragging': s.dragging, 'vt-datagrid-pivot-item-drop': s.dropping }],
        pivotItemLabel: 'vt-datagrid-pivot-item-label',
        pivotItemHow: 'vt-datagrid-pivot-item-how',
        pivotEmpty: 'vt-datagrid-pivot-empty',
        /** The toolbar over the grid, and its buttons: an icon, with its label when it shows one. */
        toolbar: 'vt-datagrid-toolbar',
        toolbarButton: (s: { labelled?: boolean; pressed?: boolean }) => ['vt-datagrid-toolbar-button', { 'vt-datagrid-toolbar-button-labelled': s.labelled, 'vt-datagrid-toolbar-button-pressed': s.pressed }],
        toolbarIcon: 'vt-datagrid-toolbar-icon',
        /** A column's description, in the popover its info button opens and in the data dictionary. */
        columnInfo: 'vt-datagrid-column-info',
        columnInfoTitle: 'vt-datagrid-column-info-title',
        columnDescription: 'vt-datagrid-column-description',
        columnNoDescription: 'vt-datagrid-column-no-description',
        columnInfoHeading: 'vt-datagrid-column-info-heading',
        columnKind: (s: { kind?: string }) => ['vt-datagrid-column-kind', `vt-datagrid-column-kind-${s.kind}`],
        columnSource: 'vt-datagrid-column-source',
        columnNotes: 'vt-datagrid-column-notes',
        columnFormula: 'vt-datagrid-column-formula',
        columnFormulaLabel: 'vt-datagrid-column-formula-label',
        columnFormulaText: 'vt-datagrid-column-formula-text',
        dictionary: 'vt-datagrid-dictionary',
        dictionaryEntry: (s: { hidden?: boolean }) => ['vt-datagrid-dictionary-entry', { 'vt-datagrid-dictionary-entry-hidden': s.hidden }],
        dictionaryTerm: 'vt-datagrid-dictionary-term',
        dictionaryDetail: 'vt-datagrid-dictionary-detail',
        dictionaryHidden: 'vt-datagrid-dictionary-hidden',
        dictionaryHeading: 'vt-datagrid-dictionary-heading',
        dictionaryModule: 'vt-datagrid-dictionary-module',
        dictionarySubtitle: 'vt-datagrid-dictionary-subtitle',
        /** The bar that counts the rows. */
        statusBar: 'vt-datagrid-status-bar',
        statusItem: (s: { kind?: string }) => ['vt-datagrid-status-item', s.kind ? `vt-datagrid-status-${s.kind}` : ''],
        groupToggle: 'vt-datagrid-group-toggle',
        groupIcon: (s: { collapsed?: boolean }) => ['vt-datagrid-group-icon', { 'vt-datagrid-group-icon-collapsed': s.collapsed }],
        groupTitle: 'vt-datagrid-group-title',
        groupCount: 'vt-datagrid-group-count',
        emptyRow: 'vt-datagrid-empty-row',
        emptyCell: 'vt-datagrid-empty-cell',
        /** `sticky`: it holds rows pinned to the bottom, and stays at the bottom of the box. */
        tfoot: (s: { sticky?: boolean }) => ['vt-datagrid-tfoot', { 'vt-datagrid-tfoot-sticky': s.sticky }],
        footerRow: 'vt-datagrid-footer-row',
        footerCell: (s: DataGridCellState) => ['vt-datagrid-footer-cell', align(s), pinned(s)],
        paginator: (s: { position?: 'top' | 'bottom' }) => ['vt-datagrid-paginator', { 'vt-datagrid-paginator-top': s.position === 'top' }],
        loadingMask: 'vt-datagrid-loading-mask',
        loadingIcon: 'vt-datagrid-loading-icon',
        loadingText: 'vt-sr-only',
        /** What a placeholder cell holds: a bar a line of text tall, or a control's box. */
        skeleton: (s: DataGridSkeletonState) => ['vt-datagrid-skeleton', { 'vt-datagrid-skeleton-box': s.box, 'vt-datagrid-skeleton-round': s.round }],
        selectionHeaderText: 'vt-sr-only',
        /** A chart a cell tall: its box, the SVG, and the marks in it. */
        sparkline: (s: { type?: string; empty?: boolean }) => ['vt-datagrid-sparkline', `vt-datagrid-sparkline-type-${s.type}`, { 'vt-datagrid-sparkline-empty': s.empty }],
        sparklineSvg: 'vt-datagrid-sparkline-svg',
        sparklineLine: 'vt-datagrid-sparkline-line',
        sparklineArea: 'vt-datagrid-sparkline-area',
        sparklineColumn: (s: { negative?: boolean }) => ['vt-datagrid-sparkline-column', { 'vt-datagrid-sparkline-negative': s.negative }],
        sparklineMarker: (s: { kind?: string }) => ['vt-datagrid-sparkline-marker', `vt-datagrid-sparkline-marker-${s.kind}`],
        sparklineHit: 'vt-datagrid-sparkline-hit',
        sparklineTrack: 'vt-datagrid-sparkline-track',
        sparklineFill: (s: { negative?: boolean }) => ['vt-datagrid-sparkline-fill', { 'vt-datagrid-sparkline-negative': s.negative }],
        sparklineText: 'vt-datagrid-sparkline-text'
    }
});

/**
 * How the grid's boxes are laid out, apart from how they look: one grid of
 * column tracks, its row groups and rows subgrids of it, so every row's cells
 * line up with the headers as a table's do. Loaded even by an unstyled grid,
 * as a browser lays a `<table>` out with no stylesheet at all.
 */
export const datagridLayoutStyle = {
    name: 'datagrid-layout',
    css: `[data-grid-table]{display:grid;align-content:start;min-width:100%;width:fit-content}
[data-grid-table]>*{grid-column:1/-1;min-width:0}
[data-grid-table]>[data-section],[data-grid-table]>[data-section]>*{display:grid;grid-template-columns:subgrid;grid-column:1/-1}
[data-grid-table]>[data-section]>*>*{align-content:center}`
};

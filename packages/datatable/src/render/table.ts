import { formatMessage, getField, MIN_COLUMN_WIDTH, pageCount, pageLinks, pageOf, type FilterMeta, type Locale } from '@vitral/core';
import { h, mergeAttrs, type Child, type Props } from '@vitral/dom';
import { getIcon, ICON_STROKE_WIDTH, ICON_VIEWBOX } from '@vitral/icons';
import { cellText, isFilterable, rowKey, type ResolvedColumn, type ResolvedRows } from '../engine/state';
import type { Content, Row, TableColumn, TableConfig, TableModels } from '../engine/types';

/**
 * The table as plain objects: a real `<table>`, one `<th scope="col">` a
 * column, a sortable header holding a button that carries the sort, native
 * controls for selection and filtering, and a paginator of buttons. What is
 * drawn is decided here; what happens when it is pressed is the handle's.
 */

/** Everything the view needs that is not the configuration itself. */
export interface ViewContext<T = Row> {
    config: TableConfig<T>;
    models: TableModels;
    columns: ResolvedColumn<T>[];
    rows: ResolvedRows<T>;
    filters: FilterMeta;
    locale: Locale;
    ids: { table: string; list: string; caption: string };
    busy: boolean;
    /** The classes and pass-through of one part in one state. */
    part: (name: string, state?: unknown) => Props;
    /** The same, for the paginator's own parts: it wears the paginator's classes wherever it is drawn. */
    pagePart: (name: string, state?: unknown) => Props;
    /** What the reader can do. */
    on: TableActions<T>;
    /** `'all'`, `'some'` or `'none'` over the rows select-all covers. */
    allState: 'all' | 'some' | 'none';
    /** Whether one row is selected; the handle knows the models and the data key. */
    selected: (row: T) => boolean;
    selectionKind?: 'single' | 'multiple';
    sorts: { field: string; order: 1 | -1 }[];
    /** Which row keeps the tab stop, when rows are focusable. */
    tabRow: number;
    /** The column list, when the table offers one. */
    chooser: { open: boolean; columns: { key: string; header: string; visible: boolean; last: boolean }[] };
    /** A column being dragged, and the one it would land before. */
    dragging: string | null;
    dropOn: string | null;
}

export interface TableActions<T = Row> {
    sort: (column: ResolvedColumn<T>, event: MouseEvent) => void;
    setFilter: (column: ResolvedColumn<T>, value: unknown) => void;
    page: (first: number, rows: number) => void;
    toggleRow: (row: T, index: number, event: Event, type: 'row' | 'checkbox' | 'radio') => void;
    toggleAll: (event: Event) => void;
    rowClick: (row: T, index: number, event: MouseEvent) => void;
    rowKeydown: (event: KeyboardEvent, index: number) => void;
    resizeStart: (column: ResolvedColumn<T>, event: PointerEvent) => void;
    resizeKey: (column: ResolvedColumn<T>, event: KeyboardEvent) => void;
    headerKeydown: (column: ResolvedColumn<T>, event: KeyboardEvent) => void;
    dragStart: (column: ResolvedColumn<T>, event: DragEvent) => void;
    dragOver: (event: DragEvent) => void;
    drop: (event: DragEvent) => void;
    dragEnd: () => void;
    pin: (column: ResolvedColumn<T>, side: 'left' | 'right' | null, event: Event) => void;
    setVisible: (key: string, visible: boolean, event: Event) => void;
    toggleChooser: () => void;
    scrolled: (event: Event) => void;
}

/** An icon from `@vitral/icons`, drawn the way the icon component draws it. */
export function iconView(name: string): Child {
    const def = getIcon(name);
    if (!def) return null;
    return h('svg', {
        class: 'vt-icon',
        viewBox: def.viewBox ?? ICON_VIEWBOX,
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': ICON_STROKE_WIDTH,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        focusable: 'false',
        'aria-hidden': 'true',
        innerHTML: def.body
    });
}

const content = (value: Content): Child => (value === null || value === undefined ? null : value);

/** A pinned column stands still while the rest scrolls; `left` and `right` are the leading and trailing edge. */
function stickyStyle(column: ResolvedColumn): Record<string, string> | undefined {
    const at = column.sticky;
    if (!at) return undefined;
    return { position: 'sticky', [at.side === 'left' ? 'inset-inline-start' : 'inset-inline-end']: `${at.offset}px`, 'z-index': '1' };
}

const pinnedState = (column: ResolvedColumn) => ({ pinned: column.sticky?.side, pinnedEdge: column.sticky?.last });

export function tableView<T>(context: ViewContext<T>): Child[] {
    const { config, part } = context;
    const rootState = {
        striped: config.stripedRows,
        gridlines: config.showGridlines,
        size: config.size,
        scrollable: config.scrollable,
        flexScroll: config.scrollHeight === 'flex',
        loading: context.busy
    };
    const paginator = config.paginator && (config.alwaysShowPaginator !== false || context.rows.total > context.models.rows);
    return [
        headerBar(context),
        paginator && config.paginatorPosition === 'top' ? paginatorView(context) : null,
        h(
            'div',
            mergeAttrs({ key: 'container' }, part('tableContainer', rootState), {
                style: config.scrollable && config.scrollHeight && config.scrollHeight !== 'flex' ? { 'max-height': config.scrollHeight } : undefined,
                onScroll: context.on.scrolled
            }),
            h(
                'table',
                mergeAttrs({ key: 'table' }, part('table'), {
                    id: context.ids.table,
                    style: config.tableStyle,
                    'aria-busy': context.busy ? 'true' : undefined,
                    'aria-label': config.caption && !config.showCaption ? undefined : config.ariaLabel,
                    'aria-labelledby': config.ariaLabelledby ?? (config.caption && !config.showCaption ? context.ids.caption : undefined)
                }),
                config.caption ? h('caption', mergeAttrs({ key: 'caption', id: context.ids.caption }, part(config.showCaption ? 'caption' : 'hiddenCaption')), config.caption) : null,
                headView(context),
                bodyView(context),
                footView(context)
            )
        ),
        paginator && config.paginatorPosition !== 'top' ? paginatorView(context) : null
    ];
}

/** The bar above the table: the host's own header, and the column list. */
function headerBar<T>(context: ViewContext<T>): Child {
    const { config, part, locale } = context;
    if (!config.columnToggle) return null;
    return h(
        'div',
        mergeAttrs({ key: 'header' }, part('header')),
        h(
            'button',
            mergeAttrs({ type: 'button' }, part('chooserButton'), {
                'aria-expanded': context.chooser.open ? 'true' : 'false',
                'aria-controls': context.ids.list,
                onClick: context.on.toggleChooser
            }),
            iconView('sliders'),
            h('span', null, locale.aria.chooseColumns)
        ),
        context.chooser.open
            ? h(
                  'div',
                  mergeAttrs({ key: 'chooser', id: context.ids.list }, part('chooserPanel'), { role: 'group', 'aria-label': locale.aria.columns }),
                  h(
                      'ul',
                      part('chooserList'),
                      context.chooser.columns.map((entry) =>
                          h(
                              'li',
                              mergeAttrs({ key: entry.key }, part('chooserItem')),
                              h(
                                  'label',
                                  part('chooserLabel'),
                                  h(
                                      'input',
                                      mergeAttrs({ type: 'checkbox' }, part('chooserCheckbox'), {
                                          checked: entry.visible,
                                          disabled: entry.visible && entry.last,
                                          onChange: (event: Event) => context.on.setVisible(entry.key, (event.target as HTMLInputElement).checked, event)
                                      })
                                  ),
                                  h('span', null, entry.header)
                              )
                          )
                      )
                  )
              )
            : null
    );
}

function headView<T>(context: ViewContext<T>): Child {
    const { columns, config, part, locale, filters } = context;
    const sortIndex = (column: ResolvedColumn<T>) => context.sorts.findIndex((sort) => sort.field === column.sortField);
    const sortIcon = (column: ResolvedColumn<T>) => {
        const meta = context.sorts[sortIndex(column)];
        return !meta ? 'sort' : meta.order === 1 ? 'arrowUp' : 'arrowDown';
    };
    // ARIA asks for aria-sort on one header at a time: the primary sort.
    const ariaSort = (column: ResolvedColumn<T>) => {
        const primary = context.sorts[0];
        return column.column.sortable && primary && primary.field === column.sortField ? (primary.order === 1 ? 'ascending' : 'descending') : undefined;
    };
    // A selection column holds a control, not a value, so there is nothing to
    // widen it for — and nothing to name its handle after.
    const canResize = (column: ResolvedColumn<T>) => !!config.resizableColumns && column.column.resizable !== false && !column.selectionMode;
    const canReorder = (column: ResolvedColumn<T>) => !!config.reorderableColumns && !column.selectionMode;
    const filterRow = config.filterDisplay === 'row' && columns.some((column) => isFilterable(column, filters));

    return h(
        'thead',
        mergeAttrs({ key: 'thead' }, part('thead')),
        h(
            'tr',
            mergeAttrs({ key: 'header-row' }, part('headerRow'), { onDragover: context.on.dragOver, onDrop: context.on.drop }),
            columns.map((column) =>
                h(
                    'th',
                    mergeAttrs(
                        { key: column.key, scope: 'col' },
                        part('headerCell', {
                            sortable: column.column.sortable,
                            sorted: sortIndex(column) >= 0,
                            align: column.align,
                            ...pinnedState(column),
                            dragging: context.dragging === column.key,
                            dropping: context.dropOn === column.key
                        }),
                        {
                            'data-column': column.key,
                            'aria-sort': ariaSort(column),
                            draggable: canReorder(column) ? 'true' : undefined,
                            style: { ...(column.width ? { width: `${column.width}px`, 'min-width': `${column.width}px` } : {}), ...stickyStyle(column), ...column.column.headerStyle },
                            class: column.column.headerClass,
                            onDragstart: (event: DragEvent) => context.on.dragStart(column, event),
                            onDragend: context.on.dragEnd,
                            onKeydown: (event: KeyboardEvent) => context.on.headerKeydown(column, event)
                        }
                    ),
                    column.selectionMode === 'multiple'
                        ? h(
                              'span',
                              part('checkbox'),
                              h(
                                  'input',
                                  mergeAttrs({ type: 'checkbox' }, part('checkboxInput'), {
                                      checked: context.allState === 'all',
                                      'aria-label': locale.aria.selectAll,
                                      ref: (el: Element) => ((el as HTMLInputElement).indeterminate = context.allState === 'some'),
                                      onChange: context.on.toggleAll
                                  })
                              ),
                              context.allState !== 'none' ? iconView(context.allState === 'all' ? 'check' : 'minus') : null
                          )
                        : column.selectionMode
                          ? h('span', part('selectionHeaderText'), locale.aria.selectRow)
                          : column.column.sortable
                            ? h(
                                  'button',
                                  mergeAttrs({ type: 'button' }, part('sortButton'), { onClick: (event: MouseEvent) => context.on.sort(column, event) }),
                                  h('span', part('headerTitle'), content(column.column.headerContent?.({ column: column.column })) ?? column.header),
                                  h('span', mergeAttrs(part('sortIcon', { active: sortIndex(column) >= 0 })), iconView(sortIcon(column))),
                                  config.sortMode === 'multiple' && context.sorts.length > 1 && sortIndex(column) >= 0
                                      ? h('span', mergeAttrs(part('sortBadge'), { 'aria-hidden': 'true' }), String(sortIndex(column) + 1))
                                      : null,
                                  sortIndex(column) > 0
                                      ? h('span', part('sortStatus'), context.sorts[sortIndex(column)]!.order === 1 ? locale.aria.sortAscending : locale.aria.sortDescending)
                                      : null
                              )
                            : (content(column.column.headerContent?.({ column: column.column })) ?? column.header),
                    canResize(column)
                        ? h(
                              'span',
                              mergeAttrs({ role: 'separator', tabindex: '0', 'aria-orientation': 'vertical' }, part('resizer'), {
                                  'aria-label': formatMessage(locale.aria.resizeColumn, { column: column.header }),
                                  // What a drag would start from, which is what the engine resizes from too.
                                  'aria-valuenow': String(Math.round(column.width ?? column.column.minWidth ?? MIN_COLUMN_WIDTH)),
                                  'aria-valuemin': String(column.column.minWidth ?? MIN_COLUMN_WIDTH),
                                  onPointerdown: (event: PointerEvent) => context.on.resizeStart(column, event),
                                  onKeydown: (event: KeyboardEvent) => context.on.resizeKey(column, event),
                                  onDblclick: (event: Event) => context.on.pin(column, column.sticky ? null : 'left', event)
                              })
                          )
                        : null
                )
            )
        ),
        filterRow
            ? h(
                  'tr',
                  mergeAttrs({ key: 'filter-row' }, part('filterRow')),
                  columns.map((column) =>
                      h(
                          'td',
                          mergeAttrs({ key: column.key }, part('filterCell', { align: column.align, ...pinnedState(column) }), { style: stickyStyle(column) }),
                          isFilterable(column, filters)
                              ? (content(
                                    column.column.filterContent?.({
                                        column: column.column,
                                        value: filterValue(filters, column),
                                        setValue: (value: unknown) => context.on.setFilter(column, value)
                                    })
                                ) ??
                                h(
                                    'span',
                                    part('filterField'),
                                    h(
                                        'input',
                                        mergeAttrs({ type: 'search' }, part('filterInput'), {
                                            value: filterText(filters, column),
                                            placeholder: column.column.filterPlaceholder,
                                            'aria-label': formatMessage(locale.aria.filterColumn, { column: column.header }),
                                            onInput: (event: Event) => context.on.setFilter(column, (event.target as HTMLInputElement).value)
                                        })
                                    )
                                ))
                              : null
                      )
                  )
              )
            : null
    );
}

const filterValue = (filters: FilterMeta, column: ResolvedColumn) => {
    const filter = filters[column.filterField];
    if (!filter) return undefined;
    return 'constraints' in filter ? filter.constraints[0]?.value : filter.value;
};
const filterText = (filters: FilterMeta, column: ResolvedColumn) => {
    const value = filterValue(filters, column);
    return value === null || value === undefined ? '' : String(value);
};

function bodyView<T>(context: ViewContext<T>): Child {
    const { columns, config, part, locale, rows } = context;
    const selectable = !!config.selectionMode;
    if (!rows.page.length) {
        return h(
            'tbody',
            mergeAttrs({ key: 'tbody' }, part('tbody')),
            h(
                'tr',
                part('emptyRow'),
                h('td', mergeAttrs(part('emptyCell'), { colspan: String(Math.max(1, columns.length)) }), config.emptyMessage ?? locale.emptyMessage)
            )
        );
    }
    return h(
        'tbody',
        mergeAttrs({ key: 'tbody' }, part('tbody')),
        rows.page.map((row, index) => {
            const selected = context.selectionKind ? context.selected(row) : false;
            return h(
                'tr',
                mergeAttrs({ key: rowKey(config, row, index, rows.offset) }, part('row', { selectable, selected }), {
                    class: config.rowClass?.(row),
                    'aria-selected': context.selectionKind ? (selected ? 'true' : 'false') : undefined,
                    tabindex: selectable ? (index === context.tabRow ? '0' : '-1') : undefined,
                    onClick: (event: MouseEvent) => context.on.rowClick(row, index, event),
                    onKeydown: (event: KeyboardEvent) => context.on.rowKeydown(event, index)
                }),
                columns.map((column) =>
                    h(
                        'td',
                        mergeAttrs({ key: column.key }, part('bodyCell', { align: column.align, ...pinnedState(column) }), column.selectionMode ? part('selectionCell') : {}, {
                            style: { ...stickyStyle(column), ...column.column.bodyStyle },
                            class: column.column.bodyClass
                        }),
                        column.selectionMode
                            ? h(
                                  'span',
                                  part('checkbox'),
                                  h(
                                      'input',
                                      mergeAttrs({ type: column.selectionMode === 'multiple' ? 'checkbox' : 'radio' }, part('checkboxInput'), {
                                          checked: selected,
                                          'aria-label': locale.aria.selectRow,
                                          onChange: (event: Event) => context.on.toggleRow(row, index, event, column.selectionMode === 'multiple' ? 'checkbox' : 'radio')
                                      })
                                  ),
                                  selected && column.selectionMode === 'multiple' ? iconView('check') : null
                              )
                            : (content(
                                  column.column.body?.({ row, index: rows.offset + index, field: column.field, value: valueOf(row, column), column: column.column })
                              ) ?? cellText(valueOf(row, column), locale.code))
                    )
                )
            );
        })
    );
}

function footView<T>(context: ViewContext<T>): Child {
    const { columns, part } = context;
    if (!columns.some((column) => column.column.footer !== undefined || column.column.footerContent)) return null;
    return h(
        'tfoot',
        mergeAttrs({ key: 'tfoot' }, part('tfoot')),
        h(
            'tr',
            part('footerRow'),
            columns.map((column) =>
                h(
                    'td',
                    mergeAttrs({ key: column.key }, part('footerCell', { align: column.align, ...pinnedState(column) }), { style: stickyStyle(column) }),
                    content(column.column.footerContent?.({ column: column.column })) ?? column.column.footer ?? ''
                )
            )
        )
    );
}

/** Pages as buttons, with the first, previous, next and last of them. */
function paginatorView<T>(context: ViewContext<T>): Child {
    const { config, models, part, pagePart, locale, rows } = context;
    const count = pageCount(rows.total, models.rows);
    const page = pageOf(models.first, models.rows);
    const go = (target: number) => () => context.on.page(Math.max(0, Math.min(count - 1, target)) * models.rows, models.rows);
    const button = (name: string, label: string, icon: string, target: number, disabled: boolean) =>
        h('button', mergeAttrs({ key: name, type: 'button' }, pagePart(name), { 'aria-label': label, disabled, onClick: go(target) }), iconView(icon));
    return h(
        'nav',
        mergeAttrs({ key: 'paginator' }, pagePart('root'), part('paginator', { position: config.paginatorPosition ?? 'bottom' }), { 'aria-label': locale.aria.pagination }),
        button('first', locale.aria.first, 'chevronsLeft', 0, page === 0),
        button('prev', locale.aria.previous, 'chevronLeft', page - 1, page === 0),
        h(
            'span',
            pagePart('pages'),
            pageLinks(page, count, config.pageLinkSize ?? 5).map((index) =>
                h(
                    'button',
                    mergeAttrs({ key: `page-${index}`, type: 'button' }, pagePart('page', { selected: index === page }), {
                        'aria-current': index === page ? 'page' : undefined,
                        'aria-label': formatMessage(locale.aria.page, { page: index + 1 }),
                        onClick: go(index)
                    }),
                    String(index + 1)
                )
            )
        ),
        button('next', locale.aria.next, 'chevronRight', page + 1, page >= count - 1),
        button('last', locale.aria.last, 'chevronsRight', count - 1, page >= count - 1)
    );
}

const valueOf = <T,>(row: T, column: ResolvedColumn<T>): unknown => (column.field ? getField(row, column.field) : undefined);

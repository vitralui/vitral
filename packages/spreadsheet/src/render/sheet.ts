import type { Locale } from '@vitral/core';
import { h, mergeAttrs, type Child, type Props } from '@vitral/dom';
import { columnLabel, formatRange, formatRef, normalizeRange } from '../engine/a1';
import { formulaReferences } from '../engine/references';
import type { Metrics, Selection, Window } from '../engine/state';
import type { Sheet } from '../engine/sheet';
import { isError, type CellAddress, type CellRange, type SpreadsheetConfig } from '../engine/types';

/**
 * The sheet as plain objects. Four boxes: the corner, the column headers, the
 * row headers and the cells; only the last one scrolls, and the headers are
 * moved by the same amount along their one axis, which pins them without
 * asking a sticky layer to hold absolutely placed cells.
 *
 * Every cell is placed by its offset and only the ones on screen are drawn,
 * so a sheet of ten thousand rows costs the same as a sheet of thirty. What
 * is drawn is decided here; what happens when it is pressed is the handle's.
 */

export interface GridActions {
    scrolled(event: Event): void;
    keydown(event: KeyboardEvent): void;
    cellDown(address: CellAddress, event: PointerEvent): void;
    cellDouble(address: CellAddress): void;
    columnDown(column: number, event: PointerEvent): void;
    rowDown(row: number, event: PointerEvent): void;
    cornerDown(event: PointerEvent): void;
    handleDown(event: PointerEvent): void;
    resizeDown(axis: 'column' | 'row', index: number, event: PointerEvent): void;
    editorInput(value: string): void;
    editorKeydown(event: KeyboardEvent): void;
    /** The cell being typed into lost the keyboard: what is there is kept. */
    editorBlur(): void;
    formulaInput(value: string): void;
    formulaKeydown(event: KeyboardEvent): void;
    copy(event: ClipboardEvent): void;
    cut(event: ClipboardEvent): void;
    paste(event: ClipboardEvent): void;
    gridRef(element: HTMLElement | null): void;
    viewportRef(element: HTMLElement | null): void;
    editorRef(element: HTMLInputElement | null): void;
}

export interface ViewContext {
    config: SpreadsheetConfig;
    sheet: Sheet;
    metrics: Metrics;
    window: Window;
    selection: Selection;
    /** The selection with its corners sorted, which is what is drawn. */
    range: CellRange;
    /** The rectangle the fill handle has been dragged over, while it is being dragged. */
    fill: CellRange | null;
    /** How far the cells have been scrolled; the headers follow along one axis. */
    scroll: { x: number; y: number };
    editing: { address: CellAddress; value: string } | null;
    resizing: { axis: 'column' | 'row'; index: number } | null;
    locale: Locale;
    ids: { grid: string };
    part: (name: string, state?: unknown) => Props;
    on: GridActions;
}

const px = (value: number) => `${value}px`;
const cellId = (ids: { grid: string }, address: CellAddress) => `${ids.grid}-${address.row}-${address.col}`;

/** Where a rectangle sits in the sheet, in pixels. */
export function rangeBox(metrics: Metrics, range: CellRange) {
    const box = normalizeRange(range);
    const left = metrics.columns.offset(box.from.col);
    const top = metrics.rows.offset(box.from.row);
    return {
        left,
        top,
        width: metrics.columns.offset(box.to.col) + metrics.columns.size(box.to.col) - left,
        height: metrics.rows.offset(box.to.row) + metrics.rows.size(box.to.row) - top
    };
}

/**
 * The element the sheet was given is the sheet's own root: its attributes and
 * its children, for the caller to patch onto it.
 */
export function sheetView(context: ViewContext): { attrs: Props; children: Child[] } {
    const { config, part, on } = context;
    return {
        attrs: mergeAttrs(part('root', { readonly: !!config.readonly, editing: !!context.editing }), {
            onCopy: on.copy,
            onCut: on.cut,
            onPaste: on.paste
        }),
        children: [config.formulaBar === false ? null : barView(context), gridView(context)]
    };
}

/** The address of the selection, and what was typed into its active cell. */
function barView(context: ViewContext): Child {
    const { part, on, selection, range, sheet, locale } = context;
    const words = locale.spreadsheet;
    const address = context.range.from.row === context.range.to.row && range.from.col === range.to.col ? formatRef(selection.active) : formatRange(range);
    return h(
        'div',
        part('bar'),
        h('span', mergeAttrs({ key: 'address' }, part('address'), { 'aria-label': words.address }), address),
        h(
            'input',
            mergeAttrs({ key: 'formula' }, part('formula'), {
                type: 'text',
                'aria-label': words.formula,
                readonly: context.config.readonly ? '' : undefined,
                value: context.editing ? context.editing.value : sheet.input(selection.active),
                onInput: (event: Event) => on.formulaInput((event.target as HTMLInputElement).value),
                onKeydown: on.formulaKeydown
            })
        )
    );
}

function gridView(context: ViewContext): Child {
    const { metrics, part, on, ids, config: settings, locale } = context;
    return h(
        'div',
        mergeAttrs({ key: 'grid' }, part('grid'), {
            role: 'grid',
            id: ids.grid,
            tabindex: 0,
            'aria-label': settings.ariaLabel ?? locale.spreadsheet.grid,
            'aria-rowcount': metrics.rows.count,
            'aria-colcount': metrics.columns.count,
            'aria-multiselectable': 'true',
            'aria-readonly': settings.readonly ? 'true' : undefined,
            'aria-activedescendant': cellId(ids, context.selection.active),
            onKeydown: on.keydown,
            ref: on.gridRef
        }),
        cornerView(context),
        columnsView(context),
        rowsView(context),
        cellsView(context)
    );
}

function cornerView(context: ViewContext): Child {
    const { part, on, locale } = context;
    return h(
        'div',
        mergeAttrs({ key: 'corner' }, part('corner'), {
            role: 'presentation',
            title: locale.spreadsheet.selectAll,
            onPointerdown: on.cornerDown
        })
    );
}

function columnsView(context: ViewContext): Child {
    const { metrics, window, part, on, range } = context;
    const children: Child[] = [];
    for (let col = window.firstColumn; col <= window.lastColumn; col++) {
        const active = col >= range.from.col && col <= range.to.col;
        children.push(
            h(
                'div',
                mergeAttrs({ key: `c${col}` }, part('column', { active }), {
                    role: 'columnheader',
                    'aria-colindex': col + 1,
                    style: { left: px(metrics.columns.offset(col)), width: px(metrics.columns.size(col)) },
                    onPointerdown: (event: PointerEvent) => on.columnDown(col, event)
                }),
                columnLabel(col),
                resizerView(context, 'column', col)
            )
        );
    }
    return h(
        'div',
        mergeAttrs({ key: 'columns' }, part('columns'), { role: 'rowgroup' }),
        h(
            'div',
            mergeAttrs({ key: 'track' }, part('track'), {
                role: 'row',
                'aria-rowindex': 1,
                style: { width: px(metrics.columns.total), height: '100%', transform: `translateX(${-context.scroll.x}px)` }
            }),
            ...children
        )
    );
}

function rowsView(context: ViewContext): Child {
    const { metrics, window, part, on, range } = context;
    const children: Child[] = [];
    for (let row = window.firstRow; row <= window.lastRow; row++) {
        const active = row >= range.from.row && row <= range.to.row;
        children.push(
            h(
                'div',
                mergeAttrs({ key: `r${row}` }, part('row', { active }), {
                    style: { top: px(metrics.rows.offset(row)), height: px(metrics.rows.size(row)) },
                    onPointerdown: (event: PointerEvent) => on.rowDown(row, event)
                }),
                String(row + 1),
                resizerView(context, 'row', row)
            )
        );
    }
    // The numbers repeat what `aria-rowindex` already says, so they are drawn
    // and not spoken.
    return h(
        'div',
        mergeAttrs({ key: 'rows' }, part('rows'), { role: 'presentation' }),
        h(
            'div',
            mergeAttrs({ key: 'track' }, part('track'), { style: { height: px(metrics.rows.total), width: '100%', transform: `translateY(${-context.scroll.y}px)` } }),
            ...children
        )
    );
}

function resizerView(context: ViewContext, axis: 'column' | 'row', index: number): Child {
    const { part, on, resizing } = context;
    return h(
        'div',
        mergeAttrs({ key: 'resizer' }, part('resizer', { axis, dragging: resizing?.axis === axis && resizing.index === index }), {
            role: 'presentation',
            onPointerdown: (event: PointerEvent) => {
                event.stopPropagation();
                on.resizeDown(axis, index, event);
            }
        })
    );
}

function cellsView(context: ViewContext): Child {
    const { sheet, metrics, window, part, on, ids, selection, range, fill, editing } = context;
    const lines: Child[] = [];
    for (let row = window.firstRow; row <= window.lastRow; row++) {
        const cells: Child[] = [];
        for (let col = window.firstColumn; col <= window.lastColumn; col++) {
            const address = { row, col };
            const value = sheet.value(address);
            const format = sheet.format(address);
            const selected = row >= range.from.row && row <= range.to.row && col >= range.from.col && col <= range.to.col;
            cells.push(
                h(
                    'div',
                    mergeAttrs({ key: `c${col}` }, part('cell', { kind: kindOf(value), align: format?.align, bold: format?.bold, italic: format?.italic }), {
                        role: 'gridcell',
                        id: cellId(ids, address),
                        'aria-colindex': col + 1,
                        'aria-selected': selected ? 'true' : 'false',
                        'aria-readonly': context.config.readonly ? 'true' : undefined,
                        style: { left: px(metrics.columns.offset(col)), width: px(metrics.columns.size(col)) },
                        onPointerdown: (event: PointerEvent) => on.cellDown(address, event),
                        onDblclick: () => on.cellDouble(address)
                    }),
                    editing && editing.address.row === row && editing.address.col === col ? '' : sheet.display(address)
                )
            );
        }
        lines.push(
            h(
                'div',
                mergeAttrs({ key: `r${row}` }, part('line'), {
                    role: 'row',
                    'aria-rowindex': row + 2,
                    style: { top: px(metrics.rows.offset(row)), height: px(metrics.rows.size(row)), width: px(metrics.columns.total) }
                }),
                ...cells
            )
        );
    }

    const selectionBox = rangeBox(metrics, fill ?? range);
    const activeBox = rangeBox(metrics, { from: selection.active, to: selection.active });
    const handleSize = 8;

    return h(
        'div',
        mergeAttrs({ key: 'viewport' }, part('viewport'), { role: 'rowgroup', onScroll: on.scrolled, ref: on.viewportRef }),
        h(
            'div',
            mergeAttrs({ key: 'sizer' }, part('sizer'), { style: { width: px(metrics.columns.total), height: px(metrics.rows.total) } }),
            ...lines,
            ...referenceViews(context),
            h('div', mergeAttrs({ key: 'range' }, part('range'), { style: boxStyle(selectionBox) })),
            h('div', mergeAttrs({ key: 'active' }, part('active'), { style: boxStyle(activeBox) })),
            context.config.readonly
                ? null
                : h(
                      'div',
                      mergeAttrs({ key: 'handle' }, part('handle'), {
                          role: 'presentation',
                          style: {
                              left: px(selectionBox.left + selectionBox.width - handleSize / 2 - 1),
                              top: px(selectionBox.top + selectionBox.height - handleSize / 2 - 1)
                          },
                          onPointerdown: on.handleDown
                      })
                  ),
            editorView(context)
        )
    );
}

/**
 * While a formula is being typed, every place it mentions is outlined where it
 * sits, each rectangle in its own colour — so `=B4*C4` says which B4 and which
 * C4 before it is committed, the way a spreadsheet has always done it. A
 * rectangle mentioned twice keeps the colour it was given the first time.
 */
function referenceViews(context: ViewContext): Child[] {
    const { editing, metrics, part } = context;
    if (!editing) return [];
    const seen = new Set<string>();
    const out: Child[] = [];
    for (const span of formulaReferences(editing.value)) {
        const key = formatRange(span.range);
        if (seen.has(key)) continue;
        out.push(h('div', mergeAttrs({ key: `ref-${key}` }, part('reference', { index: seen.size }), { style: boxStyle(rangeBox(metrics, span.range)) })));
        seen.add(key);
    }
    return out;
}

function editorView(context: ViewContext): Child {
    const { editing, metrics, part, on } = context;
    if (!editing) return null;
    const box = rangeBox(metrics, { from: editing.address, to: editing.address });
    return h(
        'input',
        mergeAttrs({ key: 'editor' }, part('editor'), {
            type: 'text',
            'aria-label': `${formatRef(editing.address)}`,
            value: editing.value,
            style: { left: px(box.left), top: px(box.top), minWidth: px(box.width), height: px(box.height) },
            onInput: (event: Event) => on.editorInput((event.target as HTMLInputElement).value),
            onKeydown: on.editorKeydown,
            onBlur: on.editorBlur,
            ref: on.editorRef
        })
    );
}

const boxStyle = (box: { left: number; top: number; width: number; height: number }) => ({
    left: px(box.left),
    top: px(box.top),
    width: px(box.width),
    height: px(box.height)
});

const kindOf = (value: unknown): 'text' | 'number' | 'error' => (isError(value) ? 'error' : typeof value === 'number' ? 'number' : 'text');

export { cellId };

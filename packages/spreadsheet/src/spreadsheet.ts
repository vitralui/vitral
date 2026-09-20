import { en, loadStyle, rovingIndex, rovingMove, type Locale } from '@vitral/core';
import { createSelect, createTooltips, type SelectHandle } from '@vitral/controls';
import { createRoot, partResolver, pointerDrag, type Child } from '@vitral/dom';
import { registerIcons } from '@vitral/icons';
import { baseStyle, spreadsheetStyle } from '@vitral/styles';
import { defaultToolbar, numberFormats, spreadsheetButtons, toolbarIcons } from './buttons';
import { columnLabel, formatRange, formatRef, keyOf, normalizeRange, parseRange, parseRef, rangeCells } from './engine/a1';
import {
    createMetrics,
    jumpTarget,
    moveSelection,
    scrollIntoView,
    selectAt,
    selectionRange,
    selectTo,
    singleCell,
    visibleWindow,
    walkSelection,
    type Metrics,
    type Selection
} from './engine/state';
import { createSheet, type Sheet } from './engine/sheet';
import type { CellAddress, CellFormat, CellRange, SpreadsheetConfig, SpreadsheetToolbarItem } from './engine/types';
import { sheetView, type GridActions, type ViewContext } from './render/sheet';
import { toolbarView, type ToolbarContext } from './render/toolbar';

/**
 * A spreadsheet with no framework in it: it is handed a configuration, it
 * draws the grid into the element it is given, and it reports what the
 * person did.
 *
 * The grid takes the keyboard as one stop and moves a caret inside itself,
 * the way a spreadsheet has always worked: the arrows move a cell, Ctrl and
 * an arrow jump to the end of a run, Shift extends the rectangle, Tab and
 * Enter walk the selected block so a table can be filled in by typing, and a
 * character starts an edit where the caret is. A pointer selects, drags a
 * rectangle, fills from the corner and resizes a column by its edge; a finger
 * scrolls, because a sheet that cannot be scrolled on a phone is no use.
 */

export interface SpreadsheetHandle {
    /** Changes part of the configuration; what did not change is not redrawn. */
    update(config: Partial<SpreadsheetConfig>): void;
    /** The document, for reading a value or writing one from outside. */
    readonly sheet: Sheet;
    /** Where the keyboard is, and the rectangle around it. */
    selection(): { active: CellAddress; range: CellRange };
    /** Puts the keyboard on a cell, in A1 or as a place. */
    select(target: string | CellAddress | CellRange): void;
    /** Draws again, for anything that changed underneath. */
    refresh(): void;
    focus(): void;
    destroy(): void;
    readonly element: HTMLElement;
}

/** What a spreadsheet tells the outside. */
export interface SpreadsheetEvents {
    /** Cells changed. */
    change?: (event: { keys: string[]; source: 'edit' | 'undo' | 'redo'; cells: Record<string, string> }) => void;
    /** The keyboard moved, or a rectangle was dragged out. */
    'selection-change'?: (event: { active: CellAddress; range: CellRange; address: string }) => void;
    /** A column was resized by its edge. */
    'column-resize'?: (event: { column: number; width: number }) => void;
    'row-resize'?: (event: { row: number; height: number }) => void;
}

export interface SpreadsheetOptions extends SpreadsheetConfig {
    on?: SpreadsheetEvents;
}

interface SelectDrag {
    kind: 'select' | 'fill';
}

interface ResizeDrag {
    axis: 'column' | 'row';
    index: number;
    size: number;
}

let counter = 0;

export function createSpreadsheet(element: HTMLElement, config: SpreadsheetOptions = {}): SpreadsheetHandle {
    let current: SpreadsheetOptions = { ...config };
    let selection: Selection = selectAt({ row: 0, col: 0 }, bounds());
    let editing: { address: CellAddress; value: string; from: 'cell' | 'bar' } | null = null;
    let fill: CellRange | null = null;
    let resizing: { axis: 'column' | 'row'; index: number } | null = null;
    let scroll = { x: 0, y: 0 };
    let viewportSize = { width: 0, height: 0 };
    let columnWidths = { ...(config.columnWidths ?? {}) };
    let rowHeights = { ...(config.rowHeights ?? {}) };
    let gridEl: HTMLElement | null = null;
    let formatHost: HTMLElement | null = null;
    let formatSelect: SelectHandle | null = null;
    /** Which toolbar button keeps the tab stop, so the bar is one stop with arrows inside it. */
    let tabStop: SpreadsheetToolbarItem | undefined;
    // What each tool is, shown the way every other Vitral control shows it —
    // rather than the browser's own `title`, which waits a second, wears the
    // system's colours and never appears for a keyboard.
    const tooltips = createTooltips(() => ({
        placement: 'bottom',
        unstyled: current.unstyled,
        nonce: current.nonce,
        cssLayer: current.cssLayer,
        zIndex: current.zIndex,
        pt: current.pt
    }));
    let viewportEl: HTMLElement | null = null;
    let editorEl: HTMLInputElement | null = null;
    let focusEditor = false;

    const id = config.id ?? `vt-spreadsheet-${++counter}`;
    const root = createRoot(element);
    const locale = (): Locale => current.locale ?? en;
    const sheet = createSheet(
        { cells: current.cells, formats: current.formats, rows: current.rows, columns: current.columns, now: current.now, locale: current.locale },
        {
            change: (event) => {
                current.on?.change?.({ ...event, cells: sheet.toJSON() });
                render();
            }
        }
    );

    const part = partResolver({
        style: spreadsheetStyle,
        unstyled: () => !!current.unstyled,
        classes: () => current.classes,
        pt: () => current.pt,
        props: () => current as Record<string, unknown>
    });

    if (!config.unstyled) {
        const options = { nonce: config.nonce, cssLayer: config.cssLayer };
        loadStyle(baseStyle.name, baseStyle.css, options);
        loadStyle(spreadsheetStyle.name, spreadsheetStyle.css, options);
    }
    // The toolbar draws its own icon definitions, but an application that
    // names one of them in its own markup should find it too.
    registerIcons(toolbarIcons);

    function bounds() {
        return { rows: current?.rows ?? 100, columns: current?.columns ?? 26 };
    }

    function metrics(): Metrics {
        return createMetrics({ ...bounds(), columnWidths, rowHeights });
    }

    const filled = (address: CellAddress) => sheet.input(address) !== '';

    // ---- the toolbar --------------------------------------------------------------

    const toolbarGroups = (): SpreadsheetToolbarItem[][] => (Array.isArray(current.toolbar) ? current.toolbar : defaultToolbar);
    /** Every button on the bar, in order: what the arrows walk. */
    const toolbarItems = (): SpreadsheetToolbarItem[] => toolbarGroups().flat();

    /** The format of the cell the caret is in: what the pressed states read. */
    const activeFormat = (): CellFormat | undefined => sheet.format(selection.active);

    /** More or fewer digits, from what the cell shows now. */
    function decimals(by: number) {
        const format = activeFormat();
        const kind = format?.kind ?? 'general';
        const current = format?.decimals ?? (kind === 'currency' ? 2 : kind === 'number' ? 2 : 0);
        const next = Math.max(0, Math.min(10, current + by));
        // A number with digits asked of it is a number, not whatever it was.
        sheet.setFormat(selectionRange(selection), { kind: kind === 'general' || kind === 'text' ? 'number' : kind, decimals: next });
    }

    function press(item: SpreadsheetToolbarItem) {
        const spec = spreadsheetButtons[item as Exclude<SpreadsheetToolbarItem, 'numberFormat'>];
        if (!spec) return;
        const command = spec.command;
        const range = selectionRange(selection);
        if (command.kind === 'history') command.step === 'undo' ? sheet.undo() : sheet.redo();
        else if (current.readonly) return;
        else if (command.kind === 'clear') sheet.setFormat(range, null);
        else if (command.kind === 'decimals') decimals(command.by);
        else sheet.setFormat(range, spec.active?.(activeFormat()) && command.off ? command.off : command.format);
        tabStop = item;
        gridEl?.focus();
        schedule();
    }

    /** The bar is one tab stop: the arrows walk the buttons inside it. */
    function toolbarKeydown(event: KeyboardEvent) {
        const move = rovingMove(event.key, { orientation: 'horizontal' });
        if (!move) return;
        const bar = (event.currentTarget as HTMLElement) ?? null;
        const buttons = bar ? [...bar.querySelectorAll<HTMLButtonElement>('button')].filter((button) => !button.disabled) : [];
        if (!buttons.length) return;
        event.preventDefault();
        const from = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = buttons[rovingIndex(move, buttons.length, from)];
        if (!next) return;
        tabStop = toolbarItems().find((item) => spreadsheetButtons[item as Exclude<SpreadsheetToolbarItem, 'numberFormat'>]?.label(locale().spreadsheet) === next.getAttribute('aria-label'));
        schedule();
        next.focus();
    }

    function toolbarContext(): ToolbarContext {
        return {
            locale: locale(),
            part,
            readonly: !!current.readonly,
            canUndo: sheet.canUndo(),
            canRedo: sheet.canRedo(),
            format: activeFormat(),
            formatRef: (element) => {
                formatHost = element as HTMLElement | null;
            },
            on: { press: (item) => press(item), keydown: toolbarKeydown, tip: (element, text) => tooltips.attach(element, text) }
        };
    }

    /** The number format, drawn by the control kit's select. */
    function syncFormatSelect() {
        if (!formatHost) return;
        const words = locale().spreadsheet;
        const settings = {
            options: numberFormats.map((kind) => ({ label: words.formats[kind] ?? kind, value: kind })),
            optionValue: 'value',
            value: activeFormat()?.kind ?? 'general',
            size: 'small' as const,
            ariaLabel: words.numberFormat,
            disabled: !!current.readonly,
            locale: locale(),
            unstyled: current.unstyled,
            overlayTarget: current.overlayTarget,
            zIndex: current.zIndex,
            nonce: current.nonce,
            cssLayer: current.cssLayer
        };
        if (formatSelect) formatSelect.update(settings);
        else
            formatSelect = createSelect(formatHost, {
                ...settings,
                onChange: (value) => {
                    sheet.setFormat(selectionRange(selection), { kind: value as CellFormat['kind'] });
                    gridEl?.focus();
                }
            });
    }

    // ---- drawing ------------------------------------------------------------------

    function render() {
        const size = metrics();
        const box = viewportSize.width ? viewportSize : { width: element.clientWidth || 640, height: 320 };
        const context: ViewContext = {
            config: current,
            sheet,
            metrics: size,
            window: visibleWindow(size, scroll, box),
            selection,
            range: selectionRange(selection),
            fill,
            scroll,
            editing: editing ? { address: editing.address, value: editing.value } : null,
            resizing,
            locale: locale(),
            ids: { grid: id },
            part,
            on: actions
        };
        const view = sheetView(context);
        const bar: Child = current.hooks?.toolbar
            ? (current.hooks.toolbar() as Child)
            : current.toolbar === false
              ? null
              : toolbarView(toolbarContext(), toolbarGroups(), tabStop ?? toolbarItems().find((item) => item !== 'numberFormat'));
        root.attrs(view.attrs);
        root.render(bar, ...view.children);
        syncFormatSelect();
        if (focusEditor && editorEl) {
            focusEditor = false;
            editorEl.focus();
            editorEl.select();
        }
    }

    // Drawing is cheap — only the cells on screen are ever in the document —
    // so it happens as it is asked for rather than a frame later, which is
    // what keeps the caret and what is typed in step.
    const schedule = render;

    function emitSelection() {
        const range = selectionRange(selection);
        current.on?.['selection-change']?.({ active: selection.active, range, address: singleCell(selection) ? formatRef(selection.active) : formatRange(range) });
    }

    function setSelection(next: Selection, options: { reveal?: boolean } = {}) {
        selection = next;
        if (options.reveal !== false) reveal(next.active);
        emitSelection();
        schedule();
    }

    function reveal(address: CellAddress) {
        if (!viewportEl) return;
        const size = metrics();
        const box = { width: viewportEl.clientWidth, height: viewportEl.clientHeight };
        // Before it has been laid out there is nothing to scroll into view,
        // and scrolling to the far edge of a box with no size would put the
        // sheet somewhere nobody asked for.
        if (!box.width || !box.height) return;
        const next = scrollIntoView(size, address, { x: viewportEl.scrollLeft, y: viewportEl.scrollTop }, box);
        if (next.x !== viewportEl.scrollLeft) viewportEl.scrollLeft = next.x;
        if (next.y !== viewportEl.scrollTop) viewportEl.scrollTop = next.y;
    }

    // ---- editing ------------------------------------------------------------------

    function startEditing(address: CellAddress, value: string, from: 'cell' | 'bar' = 'cell') {
        if (current.readonly) return;
        editing = { address, value, from };
        focusEditor = from === 'cell';
        schedule();
    }

    /** Puts what is in the editor into the cell, and says whether anything was typed. */
    function commitEditing(): boolean {
        if (!editing) return false;
        const { address, value } = editing;
        editing = null;
        if (sheet.input(address) !== value) sheet.setInput(address, value);
        else schedule();
        return true;
    }

    function cancelEditing() {
        editing = null;
        schedule();
        gridEl?.focus();
    }

    // ---- the pointer --------------------------------------------------------------

    function addressAt(event: { clientX: number; clientY: number }): CellAddress | null {
        if (!viewportEl) return null;
        const box = viewportEl.getBoundingClientRect();
        const size = metrics();
        const x = event.clientX - box.left + viewportEl.scrollLeft;
        const y = event.clientY - box.top + viewportEl.scrollTop;
        return { row: size.rows.at(y), col: size.columns.at(x) };
    }

    const drag = pointerDrag<SelectDrag>({
        threshold: 3,
        // A finger scrolls the sheet; only one that rests drags a rectangle out.
        touchDelay: 300,
        onStart: () => true,
        onMove: (start, info) => {
            const at = addressAt(info.event);
            if (!at) return;
            if (start.kind === 'select') {
                setSelection(selectTo(selection, at, bounds()), { reveal: false });
                return;
            }
            // The fill is along one axis: whichever way the pointer has gone furthest.
            const range = selectionRange(selection);
            const down = Math.abs(at.row - range.to.row) >= Math.abs(at.col - range.to.col);
            fill = normalizeRange({
                from: range.from,
                to: down ? { row: at.row, col: range.to.col } : { row: range.to.row, col: at.col }
            });
            schedule();
        },
        onEnd: (start) => {
            if (start.kind === 'fill' && fill) {
                const target = fill;
                fill = null;
                sheet.fill(selectionRange(selection), target);
                setSelection({ anchor: target.from, active: target.to });
                return;
            }
            fill = null;
            schedule();
        },
        onCancel: () => {
            fill = null;
            schedule();
        }
    });

    const resizeDrag = pointerDrag<ResizeDrag>({
        threshold: 2,
        onStart: (start) => {
            resizing = { axis: start.axis, index: start.index };
            return true;
        },
        onMove: (start, info) => {
            if (start.axis === 'column') {
                const width = Math.max(24, Math.round(start.size + info.dx));
                columnWidths = { ...columnWidths, [columnLabel(start.index)]: width };
            } else {
                const height = Math.max(16, Math.round(start.size + info.dy));
                rowHeights = { ...rowHeights, [start.index + 1]: height };
            }
            schedule();
        },
        onEnd: (start) => {
            resizing = null;
            if (start.axis === 'column') current.on?.['column-resize']?.({ column: start.index, width: columnWidths[columnLabel(start.index)]! });
            else current.on?.['row-resize']?.({ row: start.index, height: rowHeights[start.index + 1]! });
            schedule();
        },
        onCancel: () => {
            resizing = null;
            schedule();
        }
    });

    // ---- the keyboard -------------------------------------------------------------

    function onKeydown(event: KeyboardEvent) {
        // The cell being typed into is inside the grid, so its keys come
        // through here on their way out: they are the editor's, not the
        // grid's.
        if (editing || (event.target as HTMLElement | null)?.tagName === 'INPUT') return;
        const size = bounds();
        const step = arrowStep(event.key);
        const modifier = event.ctrlKey || event.metaKey;

        if (step) {
            event.preventDefault();
            const to = modifier ? jumpTarget(selection.active, step, size, filled) : null;
            setSelection(to ? { anchor: event.shiftKey ? selection.anchor : to, active: to } : moveSelection(selection, step, size, event.shiftKey));
            return;
        }
        if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            const col = event.key === 'Home' ? 0 : size.columns - 1;
            const row = modifier ? (event.key === 'Home' ? 0 : size.rows - 1) : selection.active.row;
            setSelection(event.shiftKey ? selectTo(selection, { row, col }, size) : selectAt({ row, col }, size));
            return;
        }
        if (event.key === 'PageDown' || event.key === 'PageUp') {
            event.preventDefault();
            const rows = Math.max(1, Math.floor((viewportEl?.clientHeight ?? 320) / metrics().rows.size(selection.active.row)) - 1);
            setSelection(moveSelection(selection, { rows: event.key === 'PageDown' ? rows : -rows }, size, event.shiftKey));
            return;
        }
        if (event.key === 'Tab' || event.key === 'Enter') {
            event.preventDefault();
            const range = selectionRange(selection);
            const along = event.key === 'Tab' ? 'row' : 'column';
            // One cell is not a block to walk: Tab and Enter move on from it.
            setSelection(
                singleCell(selection)
                    ? moveSelection(selection, event.key === 'Tab' ? { cols: event.shiftKey ? -1 : 1 } : { rows: event.shiftKey ? -1 : 1 }, size)
                    : walkSelection(selection, range, along, event.shiftKey)
            );
            return;
        }
        if (event.key === 'Escape') {
            setSelection(selectAt(selection.active, size));
            return;
        }
        if (event.key === 'Delete' || event.key === 'Backspace') {
            event.preventDefault();
            if (!current.readonly) sheet.clear(selectionRange(selection));
            return;
        }
        if (event.key === 'F2') {
            event.preventDefault();
            startEditing(selection.active, sheet.input(selection.active));
            return;
        }
        if (modifier && (event.key === 'z' || event.key === 'Z')) {
            event.preventDefault();
            if (event.shiftKey) sheet.redo();
            else sheet.undo();
            return;
        }
        if (modifier && (event.key === 'y' || event.key === 'Y')) {
            event.preventDefault();
            sheet.redo();
            return;
        }
        if (modifier && (event.key === 'a' || event.key === 'A')) {
            event.preventDefault();
            setSelection({ anchor: { row: 0, col: 0 }, active: { row: size.rows - 1, col: size.columns - 1 } }, { reveal: false });
            return;
        }
        // A character starts an edit and is the first thing in it, which is how
        // a spreadsheet has always taken typing.
        if (!modifier && !event.altKey && event.key.length === 1) {
            event.preventDefault();
            startEditing(selection.active, event.key);
        }
    }

    function onEditorKeydown(event: KeyboardEvent) {
        const size = bounds();
        if (event.key === 'Escape') {
            event.preventDefault();
            cancelEditing();
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            const at = editing?.address ?? selection.active;
            commitEditing();
            setSelection(moveSelection({ active: at, anchor: at }, { rows: event.shiftKey ? -1 : 1 }, size));
            gridEl?.focus();
            return;
        }
        if (event.key === 'Tab') {
            event.preventDefault();
            const at = editing?.address ?? selection.active;
            commitEditing();
            setSelection(moveSelection({ active: at, anchor: at }, { cols: event.shiftKey ? -1 : 1 }, size));
            gridEl?.focus();
        }
    }

    // ---- the clipboard ------------------------------------------------------------

    function writeClipboard(event: ClipboardEvent) {
        const range = selectionRange(selection);
        event.clipboardData?.setData('text/plain', sheet.copyText(range));
        event.preventDefault();
        return range;
    }

    const actions: GridActions = {
        gridRef: (node) => (gridEl = node),
        viewportRef: (node) => {
            viewportEl = node;
            if (node) viewportSize = { width: node.clientWidth, height: node.clientHeight };
        },
        editorRef: (node) => (editorEl = node),
        scrolled(event) {
            const node = event.currentTarget as HTMLElement;
            scroll = { x: node.scrollLeft, y: node.scrollTop };
            viewportSize = { width: node.clientWidth, height: node.clientHeight };
            schedule();
        },
        keydown: onKeydown,
        cellDown(address, event) {
            if (editing) commitEditing();
            gridEl?.focus();
            setSelection(event.shiftKey ? selectTo(selection, address, bounds()) : selectAt(address, bounds()), { reveal: false });
            drag.press(event, { kind: 'select' });
        },
        cellDouble(address) {
            startEditing(address, sheet.input(address));
        },
        columnDown(column, event) {
            gridEl?.focus();
            const size = bounds();
            const from = { row: 0, col: column };
            const to = { row: size.rows - 1, col: column };
            setSelection(event.shiftKey ? { anchor: selection.anchor, active: to } : { anchor: from, active: to }, { reveal: false });
            drag.press(event, { kind: 'select' });
        },
        rowDown(row, event) {
            gridEl?.focus();
            const size = bounds();
            const from = { row, col: 0 };
            const to = { row, col: size.columns - 1 };
            setSelection(event.shiftKey ? { anchor: selection.anchor, active: to } : { anchor: from, active: to }, { reveal: false });
            drag.press(event, { kind: 'select' });
        },
        cornerDown() {
            const size = bounds();
            gridEl?.focus();
            setSelection({ anchor: { row: 0, col: 0 }, active: { row: size.rows - 1, col: size.columns - 1 } }, { reveal: false });
        },
        handleDown(event) {
            event.stopPropagation();
            fill = selectionRange(selection);
            drag.press(event, { kind: 'fill' });
        },
        resizeDown(axis, index, event) {
            const size = metrics();
            resizeDrag.press(event, { axis, index, size: axis === 'column' ? size.columns.size(index) : size.rows.size(index) });
        },
        editorInput(value) {
            if (!editing) return;
            editing = { ...editing, value };
            // Drawn again on every keystroke, so the outlines over what the
            // formula is reading follow what is being typed. The patcher only
            // writes a field's value when it differs from what is in it, and
            // this value came out of the field, so the caret does not move.
            schedule();
        },
        editorKeydown: onEditorKeydown,
        editorBlur() {
            // Moving away keeps what was typed, which is what every sheet does.
            if (editing?.from === 'cell') commitEditing();
        },
        formulaInput(value) {
            if (!editing) {
                startEditing(selection.active, value, 'bar');
                return;
            }
            editing = { ...editing, value };
            schedule();
        },
        formulaKeydown(event) {
            if (event.key !== 'Enter' && event.key !== 'Escape') return;
            onEditorKeydown(event);
        },
        copy(event) {
            writeClipboard(event);
        },
        cut(event) {
            const range = writeClipboard(event);
            if (!current.readonly) sheet.clear(range);
        },
        paste(event) {
            if (current.readonly) return;
            const text = event.clipboardData?.getData('text/plain');
            if (text === undefined || text === '') return;
            event.preventDefault();
            const range = selectionRange(selection);
            sheet.paste(range.from, text);
            const lines = text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');
            const width = Math.max(...lines.map((line) => line.split('\t').length));
            setSelection({ anchor: range.from, active: { row: range.from.row + lines.length - 1, col: range.from.col + width - 1 } }, { reveal: false });
        }
    };

    render();

    return {
        element,
        sheet,
        selection: () => ({ active: selection.active, range: selectionRange(selection) }),
        select(target) {
            const size = bounds();
            if (typeof target === 'string') {
                const range = parseRange(target);
                if (!range) return;
                setSelection({ anchor: range.from, active: range.to });
                return;
            }
            if ('from' in target) setSelection({ anchor: target.from, active: target.to });
            else setSelection(selectAt(target, size));
        },
        update(next) {
            current = { ...current, ...next };
            if (next.cells) {
                // What is there now is cleared and what was given is put in, as
                // one step: a sheet handed a new set of cells is a new sheet.
                const entries = new Map<string, { address: CellAddress; input: string }>();
                const used = sheet.usedRange();
                if (used) for (const address of rangeCells(used)) entries.set(keyOf(address), { address, input: '' });
                for (const [address, value] of Object.entries(next.cells)) {
                    const ref = parseRef(address);
                    if (ref) entries.set(keyOf(ref), { address: ref, input: value === null || value === undefined ? '' : String(value) });
                }
                sheet.setInputs([...entries.values()]);
            }
            if (next.columnWidths) columnWidths = { ...columnWidths, ...next.columnWidths };
            if (next.rowHeights) rowHeights = { ...rowHeights, ...next.rowHeights };
            schedule();
        },
        refresh: render,
        focus: () => gridEl?.focus(),
        destroy() {
            drag.cancel();
            resizeDrag.cancel();
            formatSelect?.destroy();
            formatSelect = null;
            tooltips.destroy();
            root.clear();
        }
    };
}

function arrowStep(key: string): { rows?: number; cols?: number } | null {
    switch (key) {
        case 'ArrowUp':
            return { rows: -1 };
        case 'ArrowDown':
            return { rows: 1 };
        case 'ArrowLeft':
            return { cols: -1 };
        case 'ArrowRight':
            return { cols: 1 };
        default:
            return null;
    }
}

import {
    boardFocusTarget,
    boardMoveTarget,
    cellEntries,
    en,
    formatMessage,
    getField,
    insertionIndex,
    isClient,
    loadStyle,
    moveCard,
    moveItem,
    overlayContainerOf,
    positionOf,
    ZIndex,
    type BoardEntry,
    type BoardKey,
    type BoardPosition,
    type Locale
} from '@vitral/core';
import { autoScroll, createPortal, createRoot, partResolver, pointerDrag } from '@vitral/dom';
import { baseStyle, taskboardStyle } from '@vitral/styles';
import {
    columnOf,
    describeMove,
    entriesOf,
    initialCollapsed,
    isDisabled,
    isLocked,
    labelOf,
    lanesOf,
    otherCount,
    publicPosition,
    refusalOf,
    refusalText,
    relabel,
    settingsOf,
    wipOf,
    type BoardSettings
} from './engine/state';
import type { Refusal, TaskboardColumn, TaskboardConfig, TaskboardKey, TaskboardLane, TaskboardModels } from './engine/types';
import { boardView, previewView, type BoardActions, type ViewContext } from './render/board';

/**
 * A task board with no framework in it: it is handed a configuration, it draws
 * the board into the element it is given, and it reports what the reader did.
 *
 * Each column (or column × lane cell) is a list named by its column and its
 * card count. Cards are focusable items with a roving tab stop, and the arrow
 * keys move between them. Moving follows the accessible drag-and-drop pattern:
 * Space picks a card up, the arrows (Page Up and Page Down across lanes) carry
 * it, Space drops and Escape puts it back, and every step is announced. A
 * pointer — mouse, pen, or a finger that rests a moment — drags the same way,
 * with the board scrolling at its edges. Columns move by their handle, by
 * pointer or by the same keys. The board is shown with the move applied while
 * it is in progress, so what is seen is what a drop will commit.
 */

export interface TaskboardHandle {
    /** Changes part of the configuration; what did not change is not redrawn. */
    update(config: Partial<TaskboardConfig>): void;
    /** The models as they stand: which columns and lanes are collapsed. */
    state(): TaskboardModels;
    /** Draws again, for cards that changed underneath. */
    refresh(): void;
    /** Puts the keyboard on one card. */
    focusCard(key: string): void;
    /** Gives up a move in progress, card or column. */
    cancel(): void;
    /** Removes everything this board added to the element. */
    destroy(): void;
    readonly element: HTMLElement;
}

interface CardDrag {
    key: string;
    item: unknown;
    from: BoardPosition;
    to: BoardPosition | null;
    refused: Refusal | null;
    via: 'pointer' | 'keyboard';
}

interface ColumnDrag {
    key: TaskboardKey;
    from: number;
    to: number;
    via: 'pointer' | 'keyboard';
}

let counter = 0;

export function createTaskboard(element: HTMLElement, config: TaskboardConfig = {}): TaskboardHandle {
    let current: TaskboardConfig = { ...config };
    let models: TaskboardModels = initialCollapsed(current, lanesOf(current, current.locale ?? en));
    let drag: CardDrag | null = null;
    let columnDrag: ColumnDrag | null = null;
    let activeKey: string | null = null;
    let announcement = '';
    let preview: { x: number; y: number; offsetX: number; offsetY: number; width: number } | null = null;
    let hoverList: Element | null = null;
    let lastPoint = { x: 0, y: 0 };
    let stopPreview: (() => void) | null = null;

    const id = config.id ?? `vt-taskboard-${++counter}`;
    const root = createRoot(element);
    const portal = createPortal();
    const locale = (): Locale => current.locale ?? en;
    const part = partResolver({
        style: taskboardStyle,
        unstyled: () => !!current.unstyled,
        classes: () => current.classes,
        pt: () => current.pt,
        props: () => current as Record<string, unknown>
    });

    if (!config.unstyled) {
        const options = { nonce: config.nonce, cssLayer: config.cssLayer };
        loadStyle(baseStyle.name, baseStyle.css, options);
        loadStyle(taskboardStyle.name, taskboardStyle.css, options);
    }

    // ---- the cards and where they are -------------------------------------------------

    const settings = (): BoardSettings => settingsOf(current);
    const lanes = () => lanesOf(current, locale());
    const columns = () => current.columns ?? [];
    const entries = (): BoardEntry[] => entriesOf(current, settings(), lanes());

    /** A key for a card that has none of its own, kept while the object lives. */
    const keys = new WeakMap<object, string>();
    let keyCounter = 0;
    function keyOf(item: unknown): string {
        const own = getField(item, settings().dataKey);
        if (own !== undefined && own !== null) return String(own);
        if (item === null || typeof item !== 'object') return String(item);
        let key = keys.get(item);
        if (!key) keys.set(item, (key = `${id}-card-${keyCounter++}`));
        return key;
    }

    const dragAt = () => (drag ? entries().findIndex((entry) => keyOf(entry.item) === drag!.key) : -1);

    /** The cards as they are drawn: with the move in progress applied, unless it would be refused. */
    function shown(): BoardEntry[] {
        const list = entries();
        if (!drag || !drag.to || drag.refused) return list;
        const at = dragAt();
        return at < 0 ? list : moveCard(list, at, drag.to).entries;
    }

    const shownColumns = () => (columnDrag ? moveItem(columns(), columnDrag.from, columnDrag.to) : columns());

    function emit<K extends keyof NonNullable<TaskboardConfig['on']>>(name: K, payload: Parameters<NonNullable<NonNullable<TaskboardConfig['on']>[K]>>[0]) {
        const handler = current.on?.[name] as ((value: unknown) => void) | undefined;
        handler?.(payload);
    }

    function announce(text: string) {
        // Cleared first, so the same words said twice are read twice.
        announcement = '';
        render();
        announcement = text;
        render();
    }

    /** The cards after a move, put back the way the board was given. */
    function commitCards(next: BoardEntry[]): unknown[] {
        if (current.items === undefined) {
            const updated = columns().map((column) => ({ ...column, items: next.filter((entry) => entry.column === column.key).map((entry) => entry.item) }));
            current = { ...current, columns: updated };
            emit('update:columns', updated);
            return updated;
        }
        const list = next.map((entry) => entry.item);
        current = { ...current, items: list };
        emit('update:items', list);
        return list;
    }

    // ---- collapsing --------------------------------------------------------------------

    const isCollapsed = (column: TaskboardColumn) => models.collapsedColumns.includes(column.key);
    const isLaneCollapsed = (lane: TaskboardLane) => models.collapsedLanes.includes(lane.key);

    function change(next: Partial<TaskboardModels>) {
        models = { ...models, ...next };
        current.on?.change?.({ ...models });
        render();
    }

    const toggleColumn = (column: TaskboardColumn) =>
        change({ collapsedColumns: isCollapsed(column) ? models.collapsedColumns.filter((key) => key !== column.key) : [...models.collapsedColumns, column.key] });

    const toggleLane = (lane: TaskboardLane) =>
        change({ collapsedLanes: isLaneCollapsed(lane) ? models.collapsedLanes.filter((key) => key !== lane.key) : [...models.collapsedLanes, lane.key] });

    // ---- picking a card up and putting it down -------------------------------------------

    const movable = (item: unknown): boolean => {
        const set = settings();
        if (!set.dragdrop || set.disabled || isDisabled(item, set) || isLocked(item, set)) return false;
        const entry = entries().find((candidate) => candidate.item === item);
        return !columnOf(current, entry?.column as BoardKey)?.locked;
    };

    function setTarget(to: BoardPosition | null) {
        if (!drag) return;
        const at = dragAt();
        drag.to = to;
        drag.refused = to && at >= 0 ? refusalOf(entries(), at, to, current) : null;
    }

    function grab(item: unknown, via: 'pointer' | 'keyboard'): boolean {
        const set = settings();
        const list = entries();
        const at = list.findIndex((entry) => entry.item === item);
        if (at < 0 || set.disabled || !set.dragdrop || isDisabled(item, set)) return false;
        if (!movable(item)) {
            announce(formatMessage(locale().aria.taskboardLocked, { item: labelOf(item, set) }));
            return false;
        }
        const from = positionOf(list, at)!;
        drag = { key: keyOf(item), item, from, to: from, refused: null, via };
        if (via === 'keyboard') announce(describe(locale().aria.taskboardGrabbed, item, from, otherCount(list, from.column, from.lane, at) + 1));
        else render();
        return true;
    }

    const describe = (template: string, item: unknown, position: BoardPosition, count: number) =>
        describeMove(template, item, position, count, current, settings(), lanes(), locale());

    function drop(): boolean {
        if (!drag) return false;
        const finished = drag;
        const to = finished.to;
        const list = entries();
        const at = dragAt();
        if (!to || at < 0) {
            drag = null;
            render();
            return false;
        }
        if (finished.refused) {
            if (finished.via === 'pointer') drag = null;
            announce(refusalText(finished.refused, finished.item, to, current, settings(), locale()));
            emit('drop-refused', { item: finished.item, to: publicPosition(to), reason: finished.refused });
            return false;
        }
        const count = otherCount(list, to.column, to.lane, at) + 1;
        drag = null;
        const unchanged = finished.from.column === to.column && finished.from.lane === to.lane && finished.from.index === to.index;
        announce(describe(locale().aria.taskboardDropped, finished.item, to, count));
        if (unchanged) return true;
        const set = settings();
        const result = moveCard(list, at, to, (item, column, lane) => relabel(item, column, lane, current, set, keys));
        const value = commitCards(result.entries);
        emit('card-move', { item: result.entries[result.at]!.item, from: publicPosition(finished.from), to: publicPosition(to), value, via: finished.via });
        render();
        return true;
    }

    function cancelDrag() {
        if (!drag) return;
        const finished = drag;
        const count = otherCount(entries(), finished.from.column, finished.from.lane, dragAt()) + 1;
        drag = null;
        if (finished.via === 'keyboard') announce(describe(locale().aria.taskboardCancelled, finished.item, finished.from, count));
        else render();
    }

    // ---- the keyboard -------------------------------------------------------------------

    const isRtl = () => (isClient ? getComputedStyle(element).direction === 'rtl' : false);

    const ids = {
        help: `${id}-help`,
        columnHelp: `${id}-column-help`,
        title: (key: unknown) => `${id}-title-${safe(key)}`,
        count: (key: unknown) => `${id}-count-${safe(key)}`,
        list: (column: unknown, lane?: unknown) => `${id}-list-${safe(column)}${lane === undefined ? '' : `-${safe(lane)}`}`,
        card: (key: string) => `${id}-c-${safe(key)}`,
        handle: (key: unknown) => `${id}-handle-${safe(key)}`
    };

    function tabbableKey(): string | null {
        const keysShown = shown()
            .filter((entry) => {
                const column = columnOf(current, entry.column);
                return column && !isCollapsed(column) && !(entry.lane !== undefined && models.collapsedLanes.includes(entry.lane));
            })
            .map((entry) => keyOf(entry.item));
        return activeKey && keysShown.includes(activeKey) ? activeKey : (keysShown[0] ?? null);
    }

    function focusCard(key: string) {
        activeKey = key;
        render();
        element.ownerDocument.getElementById(ids.card(key))?.focus({ preventScroll: false });
    }

    const layout = () => ({
        columns: shownColumns().map((column) => column.key as BoardKey),
        lanes: (lanes() ?? [undefined]).map((lane) => lane?.key as BoardKey | undefined),
        skipLane: (lane: BoardKey | undefined) => lane !== undefined && models.collapsedLanes.includes(lane)
    });

    function cardKeydown(event: KeyboardEvent, item: unknown, column: TaskboardColumn) {
        const set = settings();
        if (set.disabled) return;
        const list = entries();
        if (drag && drag.via === 'keyboard') {
            const carried = drag;
            if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                drop();
                focusCard(carried.key);
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                cancelDrag();
                focusCard(carried.key);
                return;
            }
            if (event.key === 'Tab') {
                cancelDrag();
                return;
            }
            const from = carried.to ?? carried.from;
            const to = boardMoveTarget(
                from,
                event.key,
                { ...layout(), skipColumn: (key) => !!columnOf(current, key) && isCollapsed(columnOf(current, key)!) },
                (col, lane) => otherCount(list, col, lane, dragAt()),
                { ctrlKey: event.ctrlKey || event.metaKey, rtl: isRtl() }
            );
            if (!to) return;
            event.preventDefault();
            setTarget(to);
            const refused = drag?.refused;
            announce(refused ? refusalText(refused, carried.item, to, current, settings(), locale()) : describe(locale().aria.taskboardMoved, carried.item, to, otherCount(list, to.column, to.lane, dragAt()) + 1));
            focusCard(carried.key);
            return;
        }
        if (event.key === ' ') {
            event.preventDefault();
            if (grab(item, 'keyboard')) focusCard(keyOf(item));
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            cardClick(event, item, column);
            return;
        }
        const drawn = shown();
        const at = drawn.findIndex((entry) => entry.item === item);
        const position = positionOf(drawn, at);
        if (!position) return;
        const count = (col: BoardKey, lane: BoardKey | undefined) => {
            const owner = columnOf(current, col);
            return owner && isCollapsed(owner) ? 0 : cellEntries(drawn, col, lane).length;
        };
        const target = boardFocusTarget(position, event.key, layout(), count, { ctrlKey: event.ctrlKey || event.metaKey, rtl: isRtl() });
        if (!target) return;
        event.preventDefault();
        const next = cellEntries(drawn, target.column, target.lane)[target.index];
        if (next) focusCard(keyOf(next.entry.item));
    }

    function cardClick(event: Event, item: unknown, column: TaskboardColumn) {
        const set = settings();
        if (set.disabled || isDisabled(item, set)) return;
        activeKey = keyOf(item);
        emit('card-click', { item, column, originalEvent: event });
    }

    // A keyboard move ends when focus leaves the board; while a card is carried
    // it is redrawn in its new place, which blurs it for a moment, hence the wait.
    function focusout() {
        setTimeout(() => {
            const inside = element.contains(element.ownerDocument.activeElement);
            if (drag?.via === 'keyboard' && !inside) cancelDrag();
            if (columnDrag?.via === 'keyboard' && !inside) cancelColumnDrag();
        }, 0);
    }

    // ---- the pointer --------------------------------------------------------------------

    const scroller = autoScroll({
        containers: () => [element, hoverList],
        onScroll: () => hitTest(lastPoint.x, lastPoint.y)
    });

    function hitTest(x: number, y: number) {
        if (!drag) return;
        const hit = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(x, y) : null;
        const cell = hit?.closest<HTMLElement>('[data-vt-cell]');
        if (!cell || !element.contains(cell)) {
            hoverList = null;
            setTarget(null);
            render();
            return;
        }
        const column = columns()[Number(cell.dataset.column)];
        const lane = cell.dataset.lane === undefined ? undefined : lanes()?.[Number(cell.dataset.lane)];
        if (!column) return;
        hoverList = cell.querySelector('[data-vt-list]');
        let index: number;
        if (isCollapsed(column)) index = otherCount(entries(), column.key as BoardKey, lane?.key as BoardKey | undefined, dragAt());
        else {
            const mids = [...cell.querySelectorAll<HTMLElement>('[data-vt-card]')]
                .filter((el) => el.dataset.key !== drag!.key)
                .map((el) => {
                    const rect = el.getBoundingClientRect();
                    return rect.top + rect.height / 2;
                });
            index = insertionIndex(mids, y);
        }
        const to = { column: column.key as BoardKey, lane: lane?.key as BoardKey | undefined, index };
        const at = drag.to;
        if (at && at.column === to.column && at.lane === to.lane && at.index === to.index) return;
        setTarget(to);
        render();
    }

    const cardDrag = pointerDrag<{ item: unknown; el: HTMLElement }>({
        threshold: 5,
        get touchDelay() {
            return settings().touchDelay;
        },
        onStart: ({ item, el }, info) => {
            if (!grab(item, 'pointer')) return false;
            const rect = el.getBoundingClientRect();
            preview = { x: info.x, y: info.y, offsetX: info.x - rect.left - info.dx, offsetY: info.y - rect.top - info.dy, width: rect.width };
            activeKey = keyOf(item);
            render();
        },
        onMove: (_, info) => {
            lastPoint = { x: info.x, y: info.y };
            if (preview) preview = { ...preview, x: info.x, y: info.y };
            hitTest(info.x, info.y);
            if (settings().autoScroll) scroller.update(info.x, info.y);
            render();
        },
        onEnd: () => {
            scroller.stop();
            preview = null;
            drop();
            render();
        },
        onCancel: () => {
            scroller.stop();
            preview = null;
            drag = null;
            render();
        }
    });

    function cardPointerdown(event: PointerEvent, item: unknown) {
        if (!movable(item)) return;
        cardDrag.press(event, { item, el: event.currentTarget as HTMLElement });
    }

    // ---- moving a column ------------------------------------------------------------------

    function grabColumn(column: TaskboardColumn, via: 'pointer' | 'keyboard'): boolean {
        const set = settings();
        if (!set.reorderColumns || set.disabled || column.locked) return false;
        const from = columns().indexOf(column);
        if (from < 0) return false;
        columnDrag = { key: column.key, from, to: from, via };
        if (via === 'keyboard') announce(columnText(locale().aria.taskboardColumnGrabbed, column, from));
        else render();
        return true;
    }

    const columnText = (template: string, column: TaskboardColumn, index: number) =>
        formatMessage(template, { column: column.title ?? String(column.key), position: index + 1, count: columns().length });

    function dropColumn() {
        if (!columnDrag) return;
        const finished = columnDrag;
        columnDrag = null;
        const column = columns()[finished.from]!;
        announce(columnText(locale().aria.taskboardColumnDropped, column, finished.to));
        if (finished.from === finished.to) return;
        const updated = moveItem(columns(), finished.from, finished.to);
        current = { ...current, columns: updated };
        emit('update:columns', updated);
        emit('column-move', { column, from: finished.from, to: finished.to, columns: updated });
        render();
    }

    function cancelColumnDrag() {
        if (!columnDrag) return;
        const finished = columnDrag;
        columnDrag = null;
        if (finished.via === 'keyboard') announce(columnText(locale().aria.taskboardColumnCancelled, columns()[finished.from]!, finished.from));
        else render();
    }

    function focusHandle(key: TaskboardKey) {
        render();
        element.ownerDocument.getElementById(ids.handle(key))?.focus();
    }

    function handleKeydown(event: KeyboardEvent, column: TaskboardColumn) {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            if (columnDrag) dropColumn();
            else grabColumn(column, 'keyboard');
            focusHandle(column.key);
            return;
        }
        if (!columnDrag) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cancelColumnDrag();
            focusHandle(column.key);
            return;
        }
        const last = columns().length - 1;
        const rtl = isRtl();
        let to: number;
        if (event.key === 'ArrowLeft') to = columnDrag.to + (rtl ? 1 : -1);
        else if (event.key === 'ArrowRight') to = columnDrag.to + (rtl ? -1 : 1);
        else if (event.key === 'Home') to = 0;
        else if (event.key === 'End') to = last;
        else return;
        event.preventDefault();
        columnDrag = { ...columnDrag, to: Math.max(0, Math.min(last, to)) };
        announce(columnText(locale().aria.taskboardColumnMoved, column, columnDrag.to));
        focusHandle(column.key);
    }

    const handleDrag = pointerDrag<TaskboardColumn>({
        threshold: 4,
        onStart: (column) => grabColumn(column, 'pointer'),
        onMove: (_, info) => {
            if (!columnDrag) return;
            const mids = [...element.querySelectorAll<HTMLElement>('[data-vt-column-header]')]
                .filter((el) => el.dataset.key !== String(columnDrag!.key))
                .map((el) => {
                    const rect = el.getBoundingClientRect();
                    return rect.left + rect.width / 2;
                });
            const index = insertionIndex(mids, info.x);
            columnDrag = { ...columnDrag, to: isRtl() ? mids.length - index : index };
            if (settings().autoScroll) scroller.update(info.x, info.y);
            render();
        },
        onEnd: () => {
            scroller.stop();
            dropColumn();
        },
        onCancel: () => {
            scroller.stop();
            columnDrag = null;
            render();
        }
    });

    // ---- drawing ----------------------------------------------------------------------------

    const actions: BoardActions = {
        toggleColumn,
        toggleLane,
        cardPointerdown,
        cardKeydown,
        cardClick,
        cardFocus: (key) => {
            if (activeKey === key) return;
            activeKey = key;
            render();
        },
        handlePointerdown: (event, column) => handleDrag.press(event, column),
        handleKeydown,
        focusout
    };

    /** How a column looks: its limit, whether it is collapsed, and what a drop would do. */
    function columnState(drawn: readonly BoardEntry[], column: TaskboardColumn) {
        const over = drag?.to?.column === column.key;
        return {
            wip: wipOf(drawn, column),
            collapsed: isCollapsed(column),
            locked: column.locked,
            dragging: columnDrag?.key === column.key,
            drop: over && !drag?.refused,
            refused: over && !!drag?.refused
        };
    }

    function context(): ViewContext {
        const set = settings();
        const drawn = shown();
        return {
            config: current,
            settings: set,
            locale: locale(),
            columns: shownColumns(),
            declaredColumns: columns(),
            lanes: lanes(),
            entries: drawn,
            ids,
            announcement,
            part,
            keyOf,
            isCollapsed,
            isLaneCollapsed,
            tabbableKey: tabbableKey(),
            movable,
            columnState: (column) => columnState(drawn, column),
            cellState: (column, lane) => {
                const state = columnState(drawn, column);
                const here = drag?.to?.column === column.key && drag?.to?.lane === lane?.key;
                return { ...state, drop: !!state.drop && here, refused: !!state.refused && here };
            },
            cardState: (key, item) => ({
                dragging: drag?.key === key,
                grabbed: drag?.key === key && drag?.via === 'keyboard',
                disabled: isDisabled(item, set),
                locked: isLocked(item, set),
                draggable: movable(item)
            }),
            on: actions
        };
    }

    let drawing = false;
    function render() {
        if (drawing) return;
        drawing = true;
        try {
            const drawn = context();
            root.attrs({ ...part('root', { disabled: settings().disabled, dragging: cardDrag.active() || handleDrag.active() }), onFocusout: focusout });
            root.render(boardView(drawn));
            renderPreview(drawn);
        } finally {
            drawing = false;
        }
    }

    /** The card under the pointer, drawn over everything in the overlay host. */
    function renderPreview(drawn: ViewContext) {
        const wanted = !!preview && !!drag;
        const before = portal.element();
        const node = portal.render(
            wanted ? overlayTarget() : null,
            wanted
                ? previewView(drawn, drag!.item, columnOf(current, entries()[dragAt()]?.column as BoardKey) ?? columns()[0]!, drag!.from.index, {
                      width: `${preview!.width}px`,
                      transform: `translate(${preview!.x - preview!.offsetX}px, ${preview!.y - preview!.offsetY}px)`
                  })
                : null
        );
        if (!node) {
            stopPreview?.();
            stopPreview = null;
            return;
        }
        if (node === before) return;
        stopPreview?.();
        ZIndex.set('overlay', node as HTMLElement, current.zIndex ?? 1000);
        stopPreview = () => ZIndex.clear(node as HTMLElement);
    }

    function overlayTarget(): HTMLElement {
        let target = typeof current.overlayTarget === 'function' ? current.overlayTarget() : current.overlayTarget;
        if (typeof target === 'string') target = target === 'body' || target === 'self' ? undefined : (document.querySelector<HTMLElement>(target) ?? undefined);
        return target ?? overlayContainerOf(element) ?? document.body;
    }

    render();

    return {
        element,
        update(next) {
            const collapsed = 'collapsedColumns' in next || 'collapsedLanes' in next;
            current = { ...current, ...next };
            if (collapsed) {
                models = {
                    collapsedColumns: next.collapsedColumns ?? models.collapsedColumns,
                    collapsedLanes: next.collapsedLanes ?? models.collapsedLanes
                };
            }
            render();
        },
        state: () => ({ ...models }),
        refresh: render,
        focusCard,
        cancel: () => {
            cancelDrag();
            cancelColumnDrag();
        },
        destroy() {
            cardDrag.cancel();
            handleDrag.cancel();
            scroller.stop();
            stopPreview?.();
            portal.render(null, null);
            root.clear();
        }
    };
}

/** A key as part of an id: anything that is not a word character is spelled out. */
const safe = (key: unknown): string => String(key).replace(/[^\w-]/g, (char) => `_${char.charCodeAt(0)}`);

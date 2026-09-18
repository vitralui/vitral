<script setup lang="ts">
import {
    boardFocusTarget,
    boardMoveTarget,
    cellEntries,
    columnCount,
    formatMessage,
    getField,
    insertionIndex,
    moveCard,
    moveItem,
    positionOf,
    visuallyHidden,
    wipAllows,
    wipState,
    ZIndex,
    type BoardEntry,
    type BoardKey,
    type BoardPosition
} from '@vitral/core';
import { taskboardStyle } from '@vitral/styles';
import { computed, nextTick, ref, useId, watch, type VNode } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useAutoScroll, usePointerDrag } from '../../base/usePointerDrag';
import Icon from '../Icon/Icon.vue';
import type { TaskboardColumn, TaskboardEmits, TaskboardKey, TaskboardLane, TaskboardProps, TaskboardSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// A task board. Each column (or column × lane cell) is a list named by its
// column (and lane) with its card count. Cards are focusable items with a
// roving tab stop, and the arrow keys move between them. Moving follows the
// accessible drag-and-drop pattern: Space picks a card up, the arrows (Page
// Up/Down across lanes) carry it, Space drops and Escape puts it back, and
// every step is announced in a polite live region. A pointer (mouse, pen, or a
// finger that rests a moment) drags the same way, with the board scrolling at
// its edges. Columns move by their handle, by pointer or by the same keys.
// The board is shown with the move applied while it is in progress, so what is
// seen is what a drop will commit; a column's limit, a locked column or
// `canDrop` refuse a drop, and say so. The arithmetic is core's.

defineOptions({ name: 'VtTaskboard' });

const props = withDefaults(defineProps<TaskboardProps>(), {
    unstyled: undefined,
    columns: () => [],
    items: undefined,
    columnField: 'column',
    dataKey: 'id',
    cardLabel: 'title',
    disabledField: 'disabled',
    lockedField: 'locked',
    dragdrop: true,
    reorderColumns: true,
    collapsible: true,
    autoScroll: true,
    touchDelay: 250
});
const overlayTarget = useOverlayTarget();
const emit = defineEmits<TaskboardEmits>();
const slots = defineSlots<TaskboardSlots>();
const collapsedColumns = defineModel<TaskboardKey[]>('collapsedColumns');
const collapsedLanes = defineModel<TaskboardKey[]>('collapsedLanes');

const { part, locale, config } = useComponent(taskboardStyle, props);
const id = useId();
const instructionsId = `${id}-help`;
const columnHelpId = `${id}-column-help`;

const rootRef = ref<HTMLElement | null>(null);
const announcement = ref('');

// ---- the model -------------------------------------------------------------------

const OTHER = '__vt-taskboard-other__';
const localColumns = ref<TaskboardColumn[]>(props.columns);
const localItems = ref<unknown[] | undefined>(props.items);
watch(
    () => props.columns,
    (next) => (localColumns.value = next)
);
watch(
    () => props.items,
    (next) => (localItems.value = next)
);

const nested = computed(() => localItems.value === undefined);

const ids = new WeakMap<object, string>();
let counter = 0;
function keyOf(item: unknown): string {
    const own = getField(item, props.dataKey);
    if (own !== undefined && own !== null) return String(own);
    if (item === null || typeof item !== 'object') return String(item);
    let key = ids.get(item);
    if (!key) ids.set(item, (key = `${id}-card-${counter++}`));
    return key;
}
const labelOf = (item: unknown) => String(getField(item, props.cardLabel) ?? keyOf(item));
const isDisabled = (item: unknown) => !!getField(item, props.disabledField);
const isLocked = (item: unknown) => !!getField(item, props.lockedField);

const lanes = computed<TaskboardLane[] | null>(() => {
    if (!props.laneField) return null;
    const known = props.lanes ? [...props.lanes] : [];
    const seen = new Set<unknown>(known.map((l) => l.key));
    const all = nested.value ? localColumns.value.flatMap((c) => c.items ?? []) : (localItems.value ?? []);
    let other = false;
    for (const item of all) {
        const value = getField(item, props.laneField);
        if (value === undefined || value === null || value === '') other = true;
        else if (!seen.has(value)) {
            if (props.lanes) other = true;
            else {
                seen.add(value);
                known.push({ key: value as TaskboardKey, title: String(value) });
            }
        }
    }
    if (other) known.push({ key: OTHER, title: locale.value.aria.taskboardNoLane });
    return known;
});

function laneOf(item: unknown): BoardKey | undefined {
    if (!props.laneField) return undefined;
    const value = getField(item, props.laneField) as BoardKey | undefined;
    return lanes.value?.some((l) => l.key === value && value !== OTHER) ? value : OTHER;
}

const entries = computed<BoardEntry[]>(() =>
    nested.value
        ? localColumns.value.flatMap((c) => (c.items ?? []).map((item) => ({ item, column: c.key, lane: laneOf(item) })))
        : (localItems.value ?? []).map((item) => ({ item, column: getField(item, props.columnField) as BoardKey, lane: laneOf(item) }))
);

function relabel(item: unknown, column: BoardKey, lane: BoardKey | undefined) {
    if ((nested.value && !props.laneField) || item === null || typeof item !== 'object') return item;
    const copy: Record<string, unknown> = { ...(item as Record<string, unknown>) };
    if (!nested.value) copy[props.columnField] = column;
    if (props.laneField) copy[props.laneField] = lane === OTHER ? undefined : lane;
    const key = ids.get(item as object);
    if (key) ids.set(copy, key);
    return copy;
}

function commitCards(next: BoardEntry[]): unknown[] {
    if (nested.value) {
        const columns = localColumns.value.map((c) => ({ ...c, items: next.filter((e) => e.column === c.key).map((e) => e.item) }));
        localColumns.value = columns;
        emit('update:columns', columns);
        return columns;
    }
    const list = next.map((e) => e.item);
    localItems.value = list;
    emit('update:items', list);
    return list;
}

// ---- collapsing ------------------------------------------------------------------

const collapsedColumnKeys = computed(() => collapsedColumns.value ?? localColumns.value.filter((c) => c.collapsed).map((c) => c.key));
const collapsedLaneKeys = computed(() => collapsedLanes.value ?? (lanes.value ?? []).filter((l) => l.collapsed).map((l) => l.key));
const isCollapsed = (column: TaskboardColumn) => collapsedColumnKeys.value.includes(column.key);
const isLaneCollapsed = (lane: TaskboardLane) => collapsedLaneKeys.value.includes(lane.key);

function toggleColumn(column: TaskboardColumn) {
    const keys = collapsedColumnKeys.value;
    collapsedColumns.value = keys.includes(column.key) ? keys.filter((k) => k !== column.key) : [...keys, column.key];
}

function toggleLane(lane: TaskboardLane) {
    const keys = collapsedLaneKeys.value;
    collapsedLanes.value = keys.includes(lane.key) ? keys.filter((k) => k !== lane.key) : [...keys, lane.key];
}

// ---- what is shown ---------------------------------------------------------------

type Refusal = 'wip' | 'canDrop' | 'locked';

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

const drag = ref<CardDrag | null>(null);
const columnDrag = ref<ColumnDrag | null>(null);

const dragAt = () => (drag.value ? entries.value.findIndex((e) => keyOf(e.item) === drag.value!.key) : -1);

const shown = computed<BoardEntry[]>(() => {
    const d = drag.value;
    if (!d || !d.to || d.refused) return entries.value;
    const at = dragAt();
    return at < 0 ? entries.value : moveCard(entries.value, at, d.to).entries;
});

const shownColumns = computed(() => {
    const d = columnDrag.value;
    return d ? moveItem(localColumns.value, d.from, d.to) : localColumns.value;
});

const laneRows = computed<(TaskboardLane | undefined)[]>(() => lanes.value ?? [undefined]);
const columnOf = (key: BoardKey) => localColumns.value.find((c) => c.key === key);
const laneTitle = (key: BoardKey | undefined) => lanes.value?.find((l) => l.key === key)?.title ?? String(key ?? '');

function cardsIn(column: TaskboardColumn, lane: TaskboardLane | undefined) {
    return cellEntries(shown.value, column.key, lane?.key).map(({ entry }, index) => ({ item: entry.item, key: keyOf(entry.item), index }));
}

const countOf = (column: TaskboardColumn) => columnCount(shown.value, column.key);
const laneCount = (lane: TaskboardLane) => shown.value.filter((e) => e.lane === lane.key).length;
const wipOf = (column: TaskboardColumn) => wipState(countOf(column), column.wipLimit);

const gridStyle = computed(() => ({
    gridTemplateColumns: shownColumns.value
        .map((c) => (isCollapsed(c) ? 'var(--vt-taskboard-column-collapsed-width)' : 'var(--vt-taskboard-column-width)'))
        .join(' ')
}));

const safe = (key: unknown) => String(key).replace(/[^\w-]/g, (ch) => `_${ch.charCodeAt(0)}`);
const titleId = (column: TaskboardColumn) => `${id}-title-${safe(column.key)}`;
const countId = (column: TaskboardColumn) => `${id}-count-${safe(column.key)}`;
const listId = (column: TaskboardColumn, lane?: TaskboardLane) => `${id}-list-${safe(column.key)}${lane ? `-${safe(lane.key)}` : ''}`;
const cardId = (key: string) => `${id}-c-${safe(key)}`;

function countText(column: TaskboardColumn) {
    const count = countOf(column);
    return column.wipLimit !== undefined && column.wipLimit !== null
        ? formatMessage(locale.value.aria.taskboardCountLimit, { count, limit: column.wipLimit })
        : formatMessage(locale.value.aria.taskboardCount, { count });
}

function columnState(column: TaskboardColumn) {
    const over = drag.value?.to?.column === column.key;
    return {
        wip: wipOf(column),
        collapsed: isCollapsed(column),
        locked: column.locked,
        dragging: columnDrag.value?.key === column.key,
        drop: over && !drag.value?.refused,
        refused: over && !!drag.value?.refused
    };
}

function cellState(column: TaskboardColumn, lane: TaskboardLane | undefined) {
    const state = columnState(column);
    const here = drag.value?.to?.column === column.key && drag.value?.to?.lane === lane?.key;
    return { ...state, drop: state.drop && here, refused: state.refused && here };
}

const movable = (item: unknown) => props.dragdrop && !props.disabled && !isDisabled(item) && !isLocked(item) && !columnOf(entries.value.find((e) => e.item === item)?.column as BoardKey)?.locked;

// ---- announcements ---------------------------------------------------------------

function announce(text: string) {
    announcement.value = '';
    nextTick(() => (announcement.value = text));
}

function describe(template: string, item: unknown, position: BoardPosition, count: number) {
    const column = columnOf(position.column);
    const where = position.lane !== undefined ? formatMessage(locale.value.aria.taskboardCell, { column: column?.title ?? String(position.column), lane: laneTitle(position.lane) }) : (column?.title ?? String(position.column));
    return formatMessage(template, { item: labelOf(item), position: position.index + 1, count, column: where });
}

function refusalText(reason: Refusal, item: unknown, to: BoardPosition) {
    const column = columnOf(to.column);
    const name = column?.title ?? String(to.column);
    if (reason === 'wip') return formatMessage(locale.value.aria.taskboardFull, { column: name, limit: column?.wipLimit ?? 0 });
    return formatMessage(locale.value.aria.taskboardRefused, { item: labelOf(item), column: name });
}

// ---- moving a card ---------------------------------------------------------------

/** Cards in a cell, not counting the one being moved. */
function otherCount(column: BoardKey, lane: BoardKey | undefined) {
    const at = dragAt();
    return cellEntries(entries.value, column, lane).filter((c) => c.at !== at).length;
}

function refusal(at: number, to: BoardPosition): Refusal | null {
    const entry = entries.value[at];
    if (!entry) return 'canDrop';
    const column = columnOf(to.column);
    if (!column) return 'canDrop';
    const same = entry.column === to.column;
    if (column.locked && !same) return 'locked';
    if (!wipAllows(columnCount(entries.value, to.column, at), column.wipLimit, same)) return 'wip';
    const from = positionOf(entries.value, at)!;
    if (props.canDrop && !(from.column === to.column && from.lane === to.lane && from.index === to.index)) {
        if (!props.canDrop({ item: entry.item, from: publicPosition(from), to: publicPosition(to) })) return 'canDrop';
    }
    return null;
}

const publicPosition = (p: BoardPosition) => (p.lane === undefined ? { column: p.column, index: p.index } : { column: p.column, lane: p.lane === OTHER ? undefined : p.lane, index: p.index });

function setTarget(to: BoardPosition | null) {
    const d = drag.value;
    if (!d) return;
    const at = dragAt();
    d.to = to;
    d.refused = to && at >= 0 ? refusal(at, to) : null;
}

function grab(item: unknown, via: 'pointer' | 'keyboard'): boolean {
    const at = entries.value.findIndex((e) => e.item === item);
    if (at < 0 || props.disabled || !props.dragdrop || isDisabled(item)) return false;
    if (!movable(item)) {
        announce(formatMessage(locale.value.aria.taskboardLocked, { item: labelOf(item) }));
        return false;
    }
    const from = positionOf(entries.value, at)!;
    drag.value = { key: keyOf(item), item, from, to: from, refused: null, via };
    if (via === 'keyboard') announce(describe(locale.value.aria.taskboardGrabbed, item, from, otherCount(from.column, from.lane) + 1));
    return true;
}

function drop(): boolean {
    const d = drag.value;
    if (!d) return false;
    const at = dragAt();
    if (!d.to || at < 0) {
        drag.value = null;
        return false;
    }
    if (d.refused) {
        announce(refusalText(d.refused, d.item, d.to));
        emit('drop-refused', { item: d.item, to: publicPosition(d.to), reason: d.refused });
        if (d.via === 'pointer') drag.value = null;
        return false;
    }
    const to = d.to;
    const count = otherCount(to.column, to.lane) + 1;
    drag.value = null;
    const unchanged = d.from.column === to.column && d.from.lane === to.lane && d.from.index === to.index;
    announce(describe(locale.value.aria.taskboardDropped, d.item, to, count));
    if (unchanged) return true;
    const result = moveCard(entries.value, at, to, relabel);
    const value = commitCards(result.entries);
    emit('card-move', { item: result.entries[result.at]!.item, from: publicPosition(d.from), to: publicPosition(to), value, via: d.via });
    return true;
}

function cancelDrag() {
    const d = drag.value;
    if (!d) return;
    const count = otherCount(d.from.column, d.from.lane) + 1;
    drag.value = null;
    if (d.via === 'keyboard') announce(describe(locale.value.aria.taskboardCancelled, d.item, d.from, count));
}

// ---- focus and keys --------------------------------------------------------------

const activeKey = ref<string | null>(null);
const tabbableKey = computed(() => {
    const keys = shown.value.filter((e) => columnOf(e.column) && !isCollapsed(columnOf(e.column)!) && !(e.lane !== undefined && collapsedLaneKeys.value.includes(e.lane))).map((e) => keyOf(e.item));
    return activeKey.value && keys.includes(activeKey.value) ? activeKey.value : (keys[0] ?? null);
});

function focusCard(key: string) {
    activeKey.value = key;
    nextTick(() => document.getElementById(cardId(key))?.focus({ preventScroll: false }));
}

const layout = computed(() => ({
    columns: shownColumns.value.map((c) => c.key),
    lanes: laneRows.value.map((l) => l?.key),
    skipLane: (lane: BoardKey | undefined) => lane !== undefined && collapsedLaneKeys.value.includes(lane)
}));

const isRtl = () => !!rootRef.value && getComputedStyle(rootRef.value).direction === 'rtl';

function onCardKeydown(event: KeyboardEvent, item: unknown, column: TaskboardColumn) {
    if (props.disabled) return;
    const d = drag.value;
    const key = event.key;
    if (d && d.via === 'keyboard') {
        if (key === ' ' || key === 'Enter') {
            event.preventDefault();
            drop();
            focusCard(d.key);
            return;
        }
        if (key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cancelDrag();
            focusCard(d.key);
            return;
        }
        if (key === 'Tab') {
            cancelDrag();
            return;
        }
        const from = d.to ?? d.from;
        const to = boardMoveTarget(from, key, { ...layout.value, skipColumn: (c) => isCollapsed(columnOf(c)!) }, otherCount, { ctrlKey: event.ctrlKey || event.metaKey, rtl: isRtl() });
        if (!to) return;
        event.preventDefault();
        setTarget(to);
        const refused = drag.value?.refused;
        announce(refused ? refusalText(refused, d.item, to) : describe(locale.value.aria.taskboardMoved, d.item, to, otherCount(to.column, to.lane) + 1));
        focusCard(d.key);
        return;
    }
    if (key === ' ') {
        event.preventDefault();
        if (grab(item, 'keyboard')) focusCard(keyOf(item));
        return;
    }
    if (key === 'Enter') {
        event.preventDefault();
        onCardClick(event, item, column);
        return;
    }
    const at = shown.value.findIndex((e) => e.item === item);
    const position = positionOf(shown.value, at);
    if (!position) return;
    const count = (c: BoardKey, l: BoardKey | undefined) => (isCollapsed(columnOf(c)!) ? 0 : cellEntries(shown.value, c, l).length);
    const target = boardFocusTarget(position, key, layout.value, count, { ctrlKey: event.ctrlKey || event.metaKey, rtl: isRtl() });
    if (!target) return;
    event.preventDefault();
    const next = cellEntries(shown.value, target.column, target.lane)[target.index];
    if (next) focusCard(keyOf(next.entry.item));
}

function onCardClick(event: Event, item: unknown, column: TaskboardColumn) {
    if (props.disabled || isDisabled(item)) return;
    activeKey.value = keyOf(item);
    emit('card-click', { item, column, originalEvent: event });
}

// A keyboard move ends when focus leaves the board; while a card is carried it
// is re-rendered in its new place, which blurs it for a moment, hence the wait.
function onFocusout() {
    setTimeout(() => {
        if (drag.value?.via === 'keyboard' && !rootRef.value?.contains(document.activeElement)) cancelDrag();
        if (columnDrag.value?.via === 'keyboard' && !rootRef.value?.contains(document.activeElement)) cancelColumnDrag();
    }, 0);
}

// ---- pointer dragging ------------------------------------------------------------

const preview = ref<{ x: number; y: number; offsetX: number; offsetY: number; width: number } | null>(null);
let hoverList: Element | null = null;
let lastPoint = { x: 0, y: 0 };

const scroller = useAutoScroll({
    containers: () => [rootRef.value, hoverList],
    onScroll: () => hitTest(lastPoint.x, lastPoint.y)
});

function hitTest(x: number, y: number) {
    const d = drag.value;
    if (!d) return;
    const hit = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(x, y) : null;
    const cell = hit?.closest<HTMLElement>('[data-vt-cell]');
    if (!cell || !rootRef.value?.contains(cell)) {
        hoverList = null;
        setTarget(null);
        return;
    }
    const column = localColumns.value[Number(cell.dataset.column)];
    const lane = cell.dataset.lane === undefined ? undefined : lanes.value?.[Number(cell.dataset.lane)];
    if (!column) return;
    hoverList = cell.querySelector('[data-vt-list]');
    let index: number;
    if (isCollapsed(column)) index = otherCount(column.key, lane?.key);
    else {
        const mids = [...cell.querySelectorAll<HTMLElement>('[data-vt-card]')]
            .filter((el) => el.dataset.key !== d.key)
            .map((el) => {
                const r = el.getBoundingClientRect();
                return r.top + r.height / 2;
            });
        index = insertionIndex(mids, y);
    }
    const to = { column: column.key, lane: lane?.key, index };
    const current = d.to;
    if (current && current.column === to.column && current.lane === to.lane && current.index === to.index) return;
    setTarget(to);
}

const cardDrag = usePointerDrag<{ item: unknown; el: HTMLElement }>({
    threshold: 5,
    get touchDelay() {
        return props.touchDelay;
    },
    onStart: ({ item, el }, info) => {
        if (!grab(item, 'pointer')) return false;
        const rect = el.getBoundingClientRect();
        preview.value = { x: info.x, y: info.y, offsetX: info.x - rect.left - info.dx, offsetY: info.y - rect.top - info.dy, width: rect.width };
        activeKey.value = keyOf(item);
    },
    onMove: (_, info) => {
        lastPoint = { x: info.x, y: info.y };
        if (preview.value) preview.value = { ...preview.value, x: info.x, y: info.y };
        hitTest(info.x, info.y);
        if (props.autoScroll) scroller.update(info.x, info.y);
    },
    onEnd: () => {
        scroller.stop();
        preview.value = null;
        drop();
    },
    onCancel: () => {
        scroller.stop();
        preview.value = null;
        drag.value = null;
    }
});

function onCardPointerdown(event: PointerEvent, item: unknown) {
    if (!movable(item)) return;
    cardDrag.press(event, { item, el: event.currentTarget as HTMLElement });
}

const previewStyle = computed(() => {
    const p = preview.value;
    if (!p) return undefined;
    return { width: `${p.width}px`, transform: `translate(${p.x - p.offsetX}px, ${p.y - p.offsetY}px)` };
});

const previewHooks = {
    onVnodeMounted: (vnode: VNode) => ZIndex.set('overlay', vnode.el as HTMLElement, config.zIndex.overlay),
    onVnodeBeforeUnmount: (vnode: VNode) => ZIndex.clear(vnode.el as HTMLElement)
};

const draggedColumn = computed(() => (drag.value ? columnOf(entries.value[dragAt()]?.column as BoardKey) : undefined));

// ---- moving a column -------------------------------------------------------------

function grabColumn(column: TaskboardColumn, via: 'pointer' | 'keyboard'): boolean {
    if (!props.reorderColumns || props.disabled || column.locked) return false;
    const from = localColumns.value.indexOf(column);
    if (from < 0) return false;
    columnDrag.value = { key: column.key, from, to: from, via };
    if (via === 'keyboard') announce(columnText(locale.value.aria.taskboardColumnGrabbed, column, from));
    return true;
}

const columnText = (template: string, column: TaskboardColumn, index: number) =>
    formatMessage(template, { column: column.title ?? String(column.key), position: index + 1, count: localColumns.value.length });

function dropColumn() {
    const d = columnDrag.value;
    if (!d) return;
    columnDrag.value = null;
    const column = localColumns.value[d.from]!;
    announce(columnText(locale.value.aria.taskboardColumnDropped, column, d.to));
    if (d.from === d.to) return;
    const columns = moveItem(localColumns.value, d.from, d.to);
    localColumns.value = columns;
    emit('update:columns', columns);
    emit('column-move', { column, from: d.from, to: d.to, columns });
}

function cancelColumnDrag() {
    const d = columnDrag.value;
    if (!d) return;
    columnDrag.value = null;
    if (d.via === 'keyboard') announce(columnText(locale.value.aria.taskboardColumnCancelled, localColumns.value[d.from]!, d.from));
}

function focusHandle(key: TaskboardKey) {
    nextTick(() => document.getElementById(`${id}-handle-${safe(key)}`)?.focus());
}

function onHandleKeydown(event: KeyboardEvent, column: TaskboardColumn) {
    const d = columnDrag.value;
    const key = event.key;
    if (key === ' ' || key === 'Enter') {
        event.preventDefault();
        if (d) dropColumn();
        else grabColumn(column, 'keyboard');
        focusHandle(column.key);
        return;
    }
    if (!d) return;
    if (key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancelColumnDrag();
        focusHandle(column.key);
        return;
    }
    const last = localColumns.value.length - 1;
    const rtl = isRtl();
    let to: number;
    if (key === 'ArrowLeft') to = d.to + (rtl ? 1 : -1);
    else if (key === 'ArrowRight') to = d.to + (rtl ? -1 : 1);
    else if (key === 'Home') to = 0;
    else if (key === 'End') to = last;
    else return;
    event.preventDefault();
    d.to = Math.max(0, Math.min(last, to));
    announce(columnText(locale.value.aria.taskboardColumnMoved, column, d.to));
    focusHandle(column.key);
}

const handleDrag = usePointerDrag<TaskboardColumn>({
    threshold: 4,
    onStart: (column) => grabColumn(column, 'pointer'),
    onMove: (_, info) => {
        const d = columnDrag.value;
        if (!d || !rootRef.value) return;
        const mids = [...rootRef.value.querySelectorAll<HTMLElement>('[data-vt-column-header]')]
            .filter((el) => el.dataset.key !== String(d.key))
            .map((el) => {
                const r = el.getBoundingClientRect();
                return r.left + r.width / 2;
            });
        const index = insertionIndex(mids, info.x);
        d.to = isRtl() ? mids.length - index : index;
        if (props.autoScroll) scroller.update(info.x, info.y);
    },
    onEnd: () => {
        scroller.stop();
        dropColumn();
    },
    onCancel: () => {
        scroller.stop();
        columnDrag.value = null;
    }
});

defineExpose({ focusCard, cancel: () => (cancelDrag(), cancelColumnDrag()) });
</script>

<template>
    <div ref="rootRef" v-bind="part('root', { disabled, dragging: cardDrag.active.value || handleDrag.active.value })" @focusout="onFocusout">
        <div v-bind="part('grid')" :style="gridStyle">
            <!-- column headers -->
            <div
                v-for="column in shownColumns"
                :key="`h-${column.key}`"
                data-vt-column-header
                :data-key="String(column.key)"
                v-bind="part('header', columnState(column))"
            >
                <span v-if="column.color" aria-hidden="true" v-bind="part('accent')" :style="{ background: column.color }" />
                <button
                    v-if="collapsible"
                    type="button"
                    v-bind="part('toggle')"
                    :aria-label="formatMessage(locale.aria.taskboardToggle, { name: column.title ?? String(column.key) })"
                    :aria-expanded="isCollapsed(column) ? 'false' : 'true'"
                    :aria-controls="isCollapsed(column) ? undefined : laneRows.filter((l) => !l || !isLaneCollapsed(l)).map((l) => listId(column, l)).join(' ') || undefined"
                    @click="toggleColumn(column)"
                >
                    <Icon :icon="isCollapsed(column) ? 'chevronRight' : 'chevronDown'" />
                </button>
                <slot name="column-header" :column="column" :count="countOf(column)" :wip="wipOf(column)" :collapsed="isCollapsed(column)" :toggle="() => toggleColumn(column)">
                    <span :id="titleId(column)" v-bind="part('title')">{{ column.title ?? column.key }}</span>
                </slot>
                <span aria-hidden="true" v-bind="part('count', { wip: wipOf(column) })">{{ column.wipLimit !== undefined ? `${countOf(column)}/${column.wipLimit}` : countOf(column) }}</span>
                <span :id="countId(column)" :style="visuallyHidden">{{ countText(column) }}</span>
                <button
                    v-if="reorderColumns && !isCollapsed(column)"
                    :id="`${id}-handle-${safe(column.key)}`"
                    type="button"
                    v-bind="part('handle', { grabbed: columnDrag?.key === column.key })"
                    :aria-label="formatMessage(locale.aria.taskboardMoveColumn, { column: column.title ?? String(column.key) })"
                    :aria-describedby="columnHelpId"
                    :disabled="disabled || column.locked"
                    @pointerdown="handleDrag.press($event, column)"
                    @keydown="onHandleKeydown($event, column)"
                >
                    <Icon icon="grip" />
                </button>
            </div>

            <template v-for="(lane, li) in laneRows" :key="lane ? `l-${lane.key}` : 'l'">
                <div v-if="lane" v-bind="part('laneHeader', { collapsed: isLaneCollapsed(lane) })">
                    <button
                        v-if="collapsible"
                        type="button"
                        v-bind="part('toggle')"
                        :aria-label="formatMessage(locale.aria.taskboardToggle, { name: lane.title ?? String(lane.key) })"
                        :aria-expanded="isLaneCollapsed(lane) ? 'false' : 'true'"
                        :aria-controls="isLaneCollapsed(lane) ? undefined : shownColumns.filter((c) => !isCollapsed(c)).map((c) => listId(c, lane)).join(' ') || undefined"
                        @click="toggleLane(lane)"
                    >
                        <Icon :icon="isLaneCollapsed(lane) ? 'chevronRight' : 'chevronDown'" />
                    </button>
                    <slot name="lane-header" :lane="lane" :count="laneCount(lane)" :collapsed="isLaneCollapsed(lane)" :toggle="() => toggleLane(lane)">
                        <span v-bind="part('laneTitle')">{{ lane.title ?? lane.key }}</span>
                        <span v-bind="part('laneCount')">({{ laneCount(lane) }})</span>
                    </slot>
                </div>
                <template v-if="!lane || !isLaneCollapsed(lane)">
                    <div
                        v-for="column in shownColumns"
                        :key="`c-${column.key}`"
                        data-vt-cell
                        :data-column="localColumns.indexOf(column)"
                        :data-lane="lane ? li : undefined"
                        v-bind="part('cell', { ...cellState(column, lane), last: li === laneRows.length - 1 })"
                    >
                        <ul
                            :id="listId(column, lane)"
                            data-vt-list
                            :aria-labelledby="lane ? undefined : `${titleId(column)} ${countId(column)}`"
                            :aria-label="lane ? formatMessage(locale.aria.taskboardCell, { column: column.title ?? String(column.key), lane: lane.title ?? String(lane.key) }) : undefined"
                            v-bind="part('list')"
                            :style="scrollHeight ? { maxHeight: scrollHeight } : undefined"
                        >
                            <template v-if="!isCollapsed(column)">
                                <li
                                    v-for="card in cardsIn(column, lane)"
                                    :id="cardId(card.key)"
                                    :key="card.key"
                                    data-vt-card
                                    :data-key="card.key"
                                    :tabindex="!disabled && card.key === tabbableKey ? 0 : -1"
                                    :aria-describedby="movable(card.item) ? instructionsId : undefined"
                                    :aria-disabled="disabled || isDisabled(card.item) ? 'true' : undefined"
                                    v-bind="
                                        part('card', {
                                            dragging: drag?.key === card.key,
                                            grabbed: drag?.key === card.key && drag?.via === 'keyboard',
                                            disabled: isDisabled(card.item),
                                            locked: isLocked(card.item),
                                            draggable: movable(card.item)
                                        })
                                    "
                                    @pointerdown="onCardPointerdown($event, card.item)"
                                    @keydown="onCardKeydown($event, card.item, column)"
                                    @click="onCardClick($event, card.item, column)"
                                    @focus="activeKey = card.key"
                                >
                                    <Icon v-if="isLocked(card.item)" icon="lock" v-bind="part('lockIcon')" />
                                    <slot
                                        name="card"
                                        :item="card.item"
                                        :column="column"
                                        :lane="lane"
                                        :index="card.index"
                                        :dragging="drag?.key === card.key"
                                        :disabled="isDisabled(card.item)"
                                        :locked="isLocked(card.item)"
                                    >
                                        <span v-bind="part('cardTitle')">{{ labelOf(card.item) }}</span>
                                    </slot>
                                </li>
                            </template>
                        </ul>
                        <span v-if="isCollapsed(column) && li === 0" aria-hidden="true" v-bind="part('strip')">{{ column.title ?? column.key }}</span>
                        <template v-if="!isCollapsed(column)">
                            <div v-if="!cardsIn(column, lane).length" v-bind="part('empty')">
                                <slot name="empty" :column="column" :lane="lane">{{ locale.aria.taskboardEmpty }}</slot>
                            </div>
                            <div v-if="slots['add-card']" v-bind="part('addCard')">
                                <slot name="add-card" :column="column" :lane="lane" />
                            </div>
                        </template>
                    </div>
                </template>
            </template>

            <div v-for="column in shownColumns" :key="`f-${column.key}`" v-bind="part('footer', columnState(column))">
                <slot
                    v-if="!isCollapsed(column)"
                    name="column-footer"
                    :column="column"
                    :count="countOf(column)"
                    :wip="wipOf(column)"
                    :collapsed="isCollapsed(column)"
                    :toggle="() => toggleColumn(column)"
                />
            </div>
        </div>

        <span :id="instructionsId" hidden>{{ locale.aria.taskboardInstructions }}</span>
        <span :id="columnHelpId" hidden>{{ locale.aria.taskboardColumnInstructions }}</span>
        <span role="status" aria-live="polite" aria-atomic="true" v-bind="part('status')" :style="visuallyHidden">{{ announcement }}</span>

        <Teleport :to="overlayTarget">
            <div v-if="preview && drag" aria-hidden="true" v-bind="{ ...part('preview'), ...previewHooks }" :style="previewStyle">
                <div v-bind="part('card', { dragging: false, draggable: true })">
                    <slot
                        name="card"
                        :item="drag.item"
                        :column="draggedColumn ?? localColumns[0]!"
                        :lane="undefined"
                        :index="drag.from.index"
                        :dragging="true"
                        :disabled="false"
                        :locked="false"
                    >
                        <span v-bind="part('cardTitle')">{{ labelOf(drag.item) }}</span>
                    </slot>
                </div>
            </div>
        </Teleport>
    </div>
</template>

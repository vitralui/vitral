import {
    cellEntries,
    columnCount,
    formatMessage,
    getField,
    positionOf,
    wipAllows,
    wipState,
    type BoardEntry,
    type BoardKey,
    type BoardPosition,
    type Locale
} from '@vitral/core';
import type { Refusal, TaskboardColumn, TaskboardConfig, TaskboardKey, TaskboardLane, TaskboardModels, TaskboardPosition } from './types';

/**
 * What a board holds, worked out from what it was told: which lanes there are,
 * which card sits where, what each cell is called and whether a move into it
 * is allowed. All of it is a function of the configuration — no DOM, no
 * timers — so the renderer only draws the answer.
 */

/** The lane a card falls into when it names none, or names one the board does not have. */
export const OTHER_LANE = '__vt-taskboard-other__';

export const defaultModels = (): TaskboardModels => ({ collapsedColumns: [], collapsedLanes: [] });

/** The options with every default filled in. */
export interface BoardSettings {
    columnField: string;
    dataKey: string;
    cardLabel: string;
    disabledField: string;
    lockedField: string;
    dragdrop: boolean;
    reorderColumns: boolean;
    collapsible: boolean;
    autoScroll: boolean;
    touchDelay: number;
    disabled: boolean;
}

export const settingsOf = (config: TaskboardConfig): BoardSettings => ({
    columnField: config.columnField ?? 'column',
    dataKey: config.dataKey ?? 'id',
    cardLabel: config.cardLabel ?? 'title',
    disabledField: config.disabledField ?? 'disabled',
    lockedField: config.lockedField ?? 'locked',
    dragdrop: config.dragdrop ?? true,
    reorderColumns: config.reorderColumns ?? true,
    collapsible: config.collapsible ?? true,
    autoScroll: config.autoScroll ?? true,
    touchDelay: config.touchDelay ?? 250,
    disabled: !!config.disabled
});

/** A board given as columns that carry their cards, rather than one flat list. */
export const isNested = (config: TaskboardConfig): boolean => config.items === undefined;

/** Every card on the board, whichever way it was given. */
export function allItems(config: TaskboardConfig): unknown[] {
    return isNested(config) ? (config.columns ?? []).flatMap((column) => column.items ?? []) : (config.items ?? []);
}

/**
 * The lanes, in order: the ones given, else the values seen in `laneField` as
 * they appear, and one more for the cards that name none.
 */
export function lanesOf(config: TaskboardConfig, locale: Locale): TaskboardLane[] | null {
    if (!config.laneField) return null;
    const known = config.lanes ? [...config.lanes] : [];
    const seen = new Set<unknown>(known.map((lane) => lane.key));
    let other = false;
    for (const item of allItems(config)) {
        const value = getField(item, config.laneField);
        if (value === undefined || value === null || value === '') other = true;
        else if (!seen.has(value)) {
            if (config.lanes) other = true;
            else {
                seen.add(value);
                known.push({ key: value as TaskboardKey, title: String(value) });
            }
        }
    }
    if (other) known.push({ key: OTHER_LANE, title: locale.aria.taskboardNoLane });
    return known;
}

export function laneOf(item: unknown, config: TaskboardConfig, lanes: TaskboardLane[] | null): BoardKey | undefined {
    if (!config.laneField) return undefined;
    const value = getField(item, config.laneField) as BoardKey | undefined;
    return lanes?.some((lane) => lane.key === value && value !== OTHER_LANE) ? value : OTHER_LANE;
}

/** Every card with the cell it is in, in the order they are drawn. */
export function entriesOf(config: TaskboardConfig, settings: BoardSettings, lanes: TaskboardLane[] | null): BoardEntry[] {
    if (isNested(config)) {
        return (config.columns ?? []).flatMap((column) => (column.items ?? []).map((item) => ({ item, column: column.key as BoardKey, lane: laneOf(item, config, lanes) })));
    }
    return (config.items ?? []).map((item) => ({ item, column: getField(item, settings.columnField) as BoardKey, lane: laneOf(item, config, lanes) }));
}

/** A card moved to another cell takes that cell's column and lane with it. */
export function relabel(item: unknown, column: BoardKey, lane: BoardKey | undefined, config: TaskboardConfig, settings: BoardSettings, keys: WeakMap<object, string>): unknown {
    if ((isNested(config) && !config.laneField) || item === null || typeof item !== 'object') return item;
    const copy: Record<string, unknown> = { ...(item as Record<string, unknown>) };
    if (!isNested(config)) copy[settings.columnField] = column;
    if (config.laneField) copy[config.laneField] = lane === OTHER_LANE ? undefined : lane;
    const key = keys.get(item as object);
    if (key) keys.set(copy, key);
    return copy;
}

/** A position as an application reads it: the placeholder lane is nothing at all. */
export const publicPosition = (position: BoardPosition): TaskboardPosition =>
    position.lane === undefined ? { column: position.column, index: position.index } : { column: position.column, lane: position.lane === OTHER_LANE ? undefined : position.lane, index: position.index };

export const columnOf = (config: TaskboardConfig, key: BoardKey): TaskboardColumn | undefined => (config.columns ?? []).find((column) => column.key === key);

/** Whether a move into `to` is allowed, and if not, what refused it. */
export function refusalOf(entries: readonly BoardEntry[], at: number, to: BoardPosition, config: TaskboardConfig): Refusal | null {
    const entry = entries[at];
    if (!entry) return 'canDrop';
    const column = columnOf(config, to.column);
    if (!column) return 'canDrop';
    const same = entry.column === to.column;
    if (column.locked && !same) return 'locked';
    if (!wipAllows(columnCount(entries, to.column, at), column.wipLimit, same)) return 'wip';
    const from = positionOf(entries, at)!;
    if (config.canDrop && !(from.column === to.column && from.lane === to.lane && from.index === to.index)) {
        if (!config.canDrop({ item: entry.item, from: publicPosition(from), to: publicPosition(to) })) return 'canDrop';
    }
    return null;
}

/** Cards in a cell, not counting the one being carried. */
export const otherCount = (entries: readonly BoardEntry[], column: BoardKey, lane: BoardKey | undefined, at: number): number =>
    cellEntries(entries, column, lane).filter((cell) => cell.at !== at).length;

export const countOf = (entries: readonly BoardEntry[], column: TaskboardColumn): number => columnCount(entries, column.key as BoardKey);
export const wipOf = (entries: readonly BoardEntry[], column: TaskboardColumn) => wipState(countOf(entries, column), column.wipLimit);
export const laneCount = (entries: readonly BoardEntry[], lane: TaskboardLane): number => entries.filter((entry) => entry.lane === lane.key).length;

/** The count a reader hears, with the column's limit where it has one. */
export function countText(entries: readonly BoardEntry[], column: TaskboardColumn, locale: Locale): string {
    const count = countOf(entries, column);
    return column.wipLimit !== undefined && column.wipLimit !== null
        ? formatMessage(locale.aria.taskboardCountLimit, { count, limit: column.wipLimit })
        : formatMessage(locale.aria.taskboardCount, { count });
}

export const laneTitle = (lanes: TaskboardLane[] | null, key: BoardKey | undefined): string => lanes?.find((lane) => lane.key === key)?.title ?? String(key ?? '');

/** What a move is announced as: the card, where it went, and how many are there now. */
export function describeMove(
    template: string,
    item: unknown,
    position: BoardPosition,
    count: number,
    config: TaskboardConfig,
    settings: BoardSettings,
    lanes: TaskboardLane[] | null,
    locale: Locale
): string {
    const column = columnOf(config, position.column);
    const name = column?.title ?? String(position.column);
    const where = position.lane !== undefined ? formatMessage(locale.aria.taskboardCell, { column: name, lane: laneTitle(lanes, position.lane) }) : name;
    return formatMessage(template, { item: labelOf(item, settings), position: position.index + 1, count, column: where });
}

/** What a refusal is announced as. */
export function refusalText(reason: Refusal, item: unknown, to: BoardPosition, config: TaskboardConfig, settings: BoardSettings, locale: Locale): string {
    const column = columnOf(config, to.column);
    const name = column?.title ?? String(to.column);
    if (reason === 'wip') return formatMessage(locale.aria.taskboardFull, { column: name, limit: column?.wipLimit ?? 0 });
    return formatMessage(locale.aria.taskboardRefused, { item: labelOf(item, settings), column: name });
}

export const labelOf = (item: unknown, settings: BoardSettings): string => String(getField(item, settings.cardLabel) ?? '');
export const isDisabled = (item: unknown, settings: BoardSettings): boolean => !!getField(item, settings.disabledField);
export const isLocked = (item: unknown, settings: BoardSettings): boolean => !!getField(item, settings.lockedField);

/**
 * What starts collapsed: what the host bound, else what the columns and lanes
 * themselves asked for. Once the reader collapses something, the models are
 * what the board reads.
 */
export const initialCollapsed = (config: TaskboardConfig, lanes: TaskboardLane[] | null): TaskboardModels => ({
    collapsedColumns: config.collapsedColumns ?? (config.columns ?? []).filter((column) => column.collapsed).map((column) => column.key),
    collapsedLanes: config.collapsedLanes ?? (lanes ?? []).filter((lane) => lane.collapsed).map((lane) => lane.key)
});

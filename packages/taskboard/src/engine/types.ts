import type { BoardPosition, ClassEntry, Locale } from '@vitral/core';
import type { PassThrough } from '@vitral/dom';

/**
 * What a board is told, as plain data. A board is either columns that carry
 * their own cards, or one flat list of cards that name their column in a
 * field — and everything else is the same either way.
 */

export type TaskboardKey = string | number;

export interface TaskboardColumn {
    /** Identifies the column; flat items name it in their `columnField`. */
    key: TaskboardKey;
    title?: string;
    /** The column's cards, when the board is given as nested columns (no `items`). */
    items?: unknown[];
    /** The most cards the column takes: at the limit it looks full and refuses cards from other columns. */
    wipLimit?: number;
    /** Starts collapsed; `collapsedColumns` takes over once it is given. */
    collapsed?: boolean;
    /** No card can be dropped in or dragged out, and the column cannot be moved. */
    locked?: boolean;
    /** An accent for the column's header, any CSS colour. */
    color?: string;
}

export interface TaskboardLane {
    key: TaskboardKey;
    title?: string;
    collapsed?: boolean;
}

export interface TaskboardPosition {
    column: TaskboardKey;
    /** The swimlane, on a board with lanes. */
    lane?: TaskboardKey;
    /** The card's place in its cell. */
    index: number;
}

export interface TaskboardDropContext {
    item: unknown;
    from: TaskboardPosition;
    to: TaskboardPosition;
}

/** Why a drop was refused. */
export type Refusal = 'wip' | 'canDrop' | 'locked';

export interface TaskboardCardMoveEvent {
    item: unknown;
    from: TaskboardPosition;
    to: TaskboardPosition;
    /** The new flat list, or the new columns on a nested board. */
    value: unknown[];
    via: 'pointer' | 'keyboard';
}

export interface TaskboardColumnMoveEvent {
    column: TaskboardColumn;
    from: number;
    to: number;
    columns: TaskboardColumn[];
}

export interface TaskboardEvents {
    /** The columns after a card or a column moved on a nested board, or after a column moved on a flat one. */
    'update:columns'?: (value: TaskboardColumn[]) => void;
    /** The flat list after a card moved. */
    'update:items'?: (value: unknown[]) => void;
    'card-move'?: (event: TaskboardCardMoveEvent) => void;
    'column-move'?: (event: TaskboardColumnMoveEvent) => void;
    'card-click'?: (event: { item: unknown; column: TaskboardColumn; originalEvent: Event }) => void;
    'drop-refused'?: (event: { item: unknown; to: TaskboardPosition; reason: Refusal }) => void;
    /** What the reader collapsed: the models a host binds. */
    change?: (state: TaskboardModels) => void;
}

/** Content a host draws itself: a string, a node it made, or nothing. */
export type Content = string | number | Node | null | undefined;

export interface CardContext {
    item: unknown;
    column: TaskboardColumn;
    lane?: TaskboardLane;
    index: number;
    /** Being dragged, by pointer or keyboard. */
    dragging: boolean;
    disabled: boolean;
    locked: boolean;
}

export interface ColumnContext {
    column: TaskboardColumn;
    count: number;
    wip: 'under' | 'at' | 'over';
    collapsed: boolean;
    toggle: () => void;
}

/**
 * The parts a host draws itself. A framework component passes its slots
 * through here; a page with no framework hands in nodes it made, or nothing,
 * and the board draws its own.
 */
export interface TaskboardContent {
    /** A card's content. */
    card?: (context: CardContext) => Content;
    /** A column header's title area. */
    columnHeader?: (context: ColumnContext) => Content;
    /** Under a column. */
    columnFooter?: (context: ColumnContext) => Content;
    /** At the end of every cell: an "add card" button, typically. */
    addCard?: (context: { column: TaskboardColumn; lane?: TaskboardLane }) => Content;
    /** A lane header's title area. */
    laneHeader?: (context: { lane: TaskboardLane; count: number; collapsed: boolean; toggle: () => void }) => Content;
    /** An empty cell. */
    empty?: (context: { column: TaskboardColumn; lane?: TaskboardLane }) => Content;
}

/** The parts of the state a host binds: what the reader can change. */
export interface TaskboardModels {
    collapsedColumns: TaskboardKey[];
    collapsedLanes: TaskboardKey[];
}

export interface TaskboardConfig extends Partial<TaskboardModels> {
    /** The columns, in order. With no `items`, each carries its own cards. */
    columns?: TaskboardColumn[];
    /** The cards as one flat list; each names its column in `columnField`. */
    items?: unknown[];
    /** The field of a flat item that holds its column's key. Defaults to `'column'`. */
    columnField?: string;
    /** The field that places a card in a swimlane; set it to split the board into lanes. */
    laneField?: string;
    /** The lanes, in order. Without them, the lanes are the distinct values of `laneField`, in order of appearance. */
    lanes?: TaskboardLane[];
    /** The field that identifies a card. Defaults to `'id'`. */
    dataKey?: string;
    /** The field holding a card's title, shown by the default card and used in what is announced. Defaults to `'title'`. */
    cardLabel?: string;
    /** The field that marks a card disabled: not clickable and not movable. Defaults to `'disabled'`. */
    disabledField?: string;
    /** The field that marks a card locked: clickable but not movable. Defaults to `'locked'`. */
    lockedField?: string;
    /** Last word on a drop. Return false to refuse it. */
    canDrop?: (context: TaskboardDropContext) => boolean;
    /** Cards can be dragged (pointer, touch or keyboard). Defaults to true. */
    dragdrop?: boolean;
    /** Columns can be reordered by their handle. Defaults to true. */
    reorderColumns?: boolean;
    /** Columns (and lanes) get a button that collapses them. Defaults to true. */
    collapsible?: boolean;
    /** Scroll the board and the columns while a card is dragged near their edges. Defaults to true. */
    autoScroll?: boolean;
    /** Milliseconds a finger rests on a card before it drags, so a swipe still scrolls. Defaults to 250. */
    touchDelay?: number;
    /** The height of a column's card list; it scrolls past it. */
    scrollHeight?: string;
    disabled?: boolean;

    locale?: Locale;
    /** Drop the built-in classes and stylesheet; style through `pt` or `classes` instead. */
    unstyled?: boolean;
    classes?: Partial<Record<string, ClassEntry>>;
    pt?: PassThrough;
    /** What the host draws itself. */
    content?: TaskboardContent;
    /** Prefix of the ids the board gives its elements; generated when unset. */
    id?: string;
    /** For a Content-Security-Policy: the nonce of the injected stylesheet. */
    nonce?: string;
    /** A CSS cascade layer to put the stylesheet in. */
    cssLayer?: string | false;
    /** Where the card being dragged is drawn: an element, a selector, or a function giving either. */
    overlayTarget?: HTMLElement | string | (() => HTMLElement | string | null | undefined);
    /** The z-index the dragged card is given. */
    zIndex?: number;
    on?: TaskboardEvents;
}

export type { BoardPosition };

import type { BaseProps } from '../../base/types';

export type TaskboardKey = string | number;

export interface TaskboardColumn {
    /** Identifies the column; flat items name it in their `columnField`. */
    key: TaskboardKey;
    title?: string;
    /** The column's cards, when the board is given as nested columns (no `items` prop). */
    items?: unknown[];
    /** The most cards the column takes: at the limit it looks full and refuses cards from other columns. */
    wipLimit?: number;
    /** Starts collapsed. `v-model:collapsedColumns` takes over once bound. */
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

export interface TaskboardProps extends BaseProps {
    /** The columns, in order. With no `items`, each carries its own cards (`v-model:columns`). */
    columns?: TaskboardColumn[];
    /** The cards as one flat list (`v-model:items`); each names its column in `columnField`. */
    items?: unknown[];
    /** The field of a flat item that holds its column's key. Defaults to `'column'`. */
    columnField?: string;
    /** The field that places a card in a swimlane; set it to split the board into lanes. */
    laneField?: string;
    /** The lanes, in order. Without them, the lanes are the distinct values of `laneField`, in order of appearance. */
    lanes?: TaskboardLane[];
    /** The field that identifies a card. Defaults to `'id'`. */
    dataKey?: string;
    /** The field holding a card's title, shown by the default card and used in the announcements. Defaults to `'title'`. */
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
}

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

export interface TaskboardDropRefusedEvent {
    item: unknown;
    to: TaskboardPosition;
    reason: 'wip' | 'canDrop' | 'locked';
}

export type TaskboardEmits = {
    /** The columns after a card or column moved on a nested board, or after a column moved on a flat one. */
    'update:columns': [value: TaskboardColumn[]];
    /** The flat list after a card moved. */
    'update:items': [value: unknown[]];
    'card-move': [event: TaskboardCardMoveEvent];
    'column-move': [event: TaskboardColumnMoveEvent];
    'card-click': [event: { item: unknown; column: TaskboardColumn; originalEvent: Event }];
    'drop-refused': [event: TaskboardDropRefusedEvent];
};

export interface TaskboardCardSlotProps {
    item: unknown;
    column: TaskboardColumn;
    lane?: TaskboardLane;
    index: number;
    /** Being dragged, by pointer or keyboard. */
    dragging: boolean;
    disabled: boolean;
    locked: boolean;
}

export interface TaskboardColumnSlotProps {
    column: TaskboardColumn;
    count: number;
    wip: 'under' | 'at' | 'over';
    collapsed: boolean;
    toggle: () => void;
}

export interface TaskboardSlots {
    /** A card's content. */
    card?: (props: TaskboardCardSlotProps) => unknown;
    /** A column header's title area. */
    'column-header'?: (props: TaskboardColumnSlotProps) => unknown;
    /** Under a column. */
    'column-footer'?: (props: TaskboardColumnSlotProps) => unknown;
    /** At the end of every cell: an "add card" button, typically. */
    'add-card'?: (props: { column: TaskboardColumn; lane?: TaskboardLane }) => unknown;
    /** A lane header's title area. */
    'lane-header'?: (props: { lane: TaskboardLane; count: number; collapsed: boolean; toggle: () => void }) => unknown;
    /** An empty cell. */
    empty?: (props: { column: TaskboardColumn; lane?: TaskboardLane }) => unknown;
}

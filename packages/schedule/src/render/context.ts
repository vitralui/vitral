import type { Locale } from '@vitral/core';
import type { Child, Props } from '@vitral/dom';
import type { ScheduleSettings } from '../engine/state';
import type { Content, Occurrence, ScheduleCell, ScheduleConfig, ScheduleModels, ScheduleResource } from '../engine/types';

/**
 * What every view is given. The views are layout only: the state, the
 * keyboard, the pointer gestures and the text are the handle's, and reach them
 * through here.
 */
export interface ViewContext {
    config: ScheduleConfig;
    models: ScheduleModels;
    settings: ScheduleSettings;
    locale: Locale;
    range: { start: Date; end: Date };
    days: Date[];
    occurrences: Occurrence[];
    resources: ScheduleResource[];
    views: ScheduleModels['view'][];
    title: string;
    today: Date;
    now: Date;
    /** The cell that holds the grid's tab stop. */
    focus: { date: Date; resource: number };
    selection: { start: Date; end: Date; allDay: boolean; resource: number } | null;
    /** The event being dragged, by key. */
    dragging: string | null;
    announcement: string;
    ids: { title: string; gridHelp: string; eventHelp: string; more: string };
    /** The classes and pass-through of one part in one state. */
    part: (name: string, state?: unknown) => Props;
    /** The button's classes, for the toolbar the schedule draws itself. */
    buttonPart: (name: string, state?: unknown) => Props;
    /** Gives a control the tooltip that says what it does. */
    tip: (element: Element | null, text: string | undefined) => void;
    /** The attributes the grid itself wears, naming and keyboard included. */
    gridAttrs: () => Props;
    format: (date: Date, pattern: string) => string;
    formatTime: (date: Date) => string;
    labelOf: (occurrence: Occurrence) => string;
    cellLabel: (cell: ScheduleCell) => string;
    isFocused: (cell: ScheduleCell) => boolean;
    isSelected: (cell: ScheduleCell) => boolean;
    isBusiness: (start: Date, end: Date) => boolean;
    /** Attributes and listeners for one cell of a grid. */
    cellAttrs: (cell: ScheduleCell) => Props;
    on: ViewActions;
}

export interface ViewActions {
    prev: () => void;
    next: () => void;
    today: () => void;
    setView: (view: ScheduleModels['view']) => void;
    gotoDay: (day: Date) => void;
    gridKeydown: (event: KeyboardEvent) => void;
    eventClick: (event: Event, occurrence: Occurrence) => void;
    eventKeydown: (event: KeyboardEvent, occurrence: Occurrence) => void;
    eventPointerdown: (event: PointerEvent, occurrence: Occurrence, kind: 'move' | 'resize') => void;
    showMore: (event: Event, day: Date) => void;
    /** The element the view scrolls, as it is drawn. */
    scroller: (element: Element | null) => void;
}

export const content = (value: Content): Child => (value === null || value === undefined ? null : value);

export const pct = (n: number): string => `${(n * 100).toFixed(4)}%`;

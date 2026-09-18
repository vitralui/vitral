import type { Locale, ScheduleOccurrence } from '@vitral/core';
import type { ComputedRef, InjectionKey, Ref } from 'vue';
import type { PassThroughAttrs } from '../../base/types';
import type { ScheduleEvent, ScheduleProps, ScheduleResource, ScheduleSlots, ScheduleViewName } from './types';

// What Schedule shares with the views it draws. The views are layout only:
// the state, the keyboard, the pointer gestures and the text live in Schedule.

export type Occurrence = ScheduleOccurrence<ScheduleEvent>;

export interface ScheduleCell {
    start: Date;
    /** Minutes the cell spans: a slot, or a whole day (1440). */
    span: number;
    allDay: boolean;
    resource: number;
}

export interface ScheduleContext {
    part: (name: string, state?: unknown) => PassThroughAttrs;
    locale: ComputedRef<Locale>;
    props: Readonly<Required<Pick<ScheduleProps, 'editable' | 'selectable' | 'nowIndicator' | 'maxEventsPerDay' | 'scrollHeight'>>> & ScheduleProps;
    slots: ScheduleSlots;
    id: string;
    view: Ref<ScheduleViewName>;
    views: ComputedRef<ScheduleViewName[]>;
    range: ComputedRef<{ start: Date; end: Date }>;
    /** Days the view shows (not for month). */
    days: ComputedRef<Date[]>;
    occurrences: ComputedRef<Occurrence[]>;
    resources: ComputedRef<ScheduleResource[]>;
    today: Ref<Date>;
    now: Ref<Date>;
    firstDay: ComputedRef<number>;
    minMinutes: ComputedRef<number>;
    maxMinutes: ComputedRef<number>;
    slotMinutes: ComputedRef<number>;
    timelineSlotMinutes: ComputedRef<number>;
    /** The cell that holds the grid's tab stop. */
    focus: Ref<{ date: Date; resource: number }>;
    selection: ComputedRef<{ start: Date; end: Date; allDay: boolean; resource: number } | null>;
    gridAttrs: ComputedRef<Record<string, unknown>>;
    instructionsId: string;
    eventInstructionsId: string;

    colorOf: (occ: Occurrence) => string;
    labelOf: (occ: Occurrence) => string;
    titleOf: (occ: Occurrence) => string;
    timeText: (occ: Occurrence) => string;
    isEditable: (occ: Occurrence) => boolean;
    isDragging: (occ: Occurrence) => boolean;
    format: (date: Date, pattern: string) => string;
    formatTime: (date: Date) => string;
    isBusiness: (start: Date, end: Date) => boolean;
    isFocused: (cell: ScheduleCell) => boolean;
    isSelected: (cell: ScheduleCell) => boolean;
    cellLabel: (cell: ScheduleCell) => string;
    /** Attributes and listeners for a cell. */
    cellAttrs: (cell: ScheduleCell) => Record<string, unknown>;

    onGridKeydown: (event: KeyboardEvent) => void;
    onEventPointerdown: (event: PointerEvent, occ: Occurrence, kind: 'move' | 'resize') => void;
    onEventKeydown: (event: KeyboardEvent, occ: Occurrence) => void;
    onEventClick: (event: Event, occ: Occurrence) => void;
    gotoDay: (date: Date) => void;
    showMore: (event: Event, date: Date) => void;
    registerScroller: (el: HTMLElement | null) => void;
}

export const scheduleKey: InjectionKey<ScheduleContext> = Symbol('vt-schedule');

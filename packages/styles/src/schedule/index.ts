import { defineStyle } from '../defineStyle';
import css from './schedule.css?raw';

export interface ScheduleCellState {
    today?: boolean;
    selected?: boolean;
    focused?: boolean;
    business?: boolean;
    hour?: boolean;
    weekend?: boolean;
    otherMonth?: boolean;
    dayStart?: boolean;
}

export interface ScheduleEventState {
    variant?: 'timed' | 'span' | 'list' | 'lane';
    editable?: boolean;
    dragging?: boolean;
    allDay?: boolean;
    continuesBefore?: boolean;
    continuesAfter?: boolean;
}

const cell = (name: string) => (s: ScheduleCellState) => [
    name,
    {
        'vt-schedule-today': s.today,
        'vt-schedule-selected': s.selected,
        'vt-schedule-focused': s.focused,
        'vt-schedule-off-hours': s.business === false,
        'vt-schedule-hour': s.hour,
        'vt-schedule-weekend': s.weekend,
        'vt-schedule-other-month': s.otherMonth,
        'vt-schedule-day-start': s.dayStart
    }
];

export const scheduleStyle = defineStyle({
    name: 'schedule',
    css,
    classes: {
        root: (s: { view?: string; dragging?: boolean }) => ['vt-schedule', `vt-schedule-view-${s.view}`, { 'vt-schedule-dragging': s.dragging }],
        toolbar: 'vt-schedule-toolbar',
        nav: 'vt-schedule-nav',
        title: 'vt-schedule-title',
        views: 'vt-schedule-views',
        status: 'vt-schedule-status',
        grid: (s: { view?: string }) => ['vt-schedule-grid', `vt-schedule-grid-${s.view}`],
        head: 'vt-schedule-head',
        headRow: 'vt-schedule-head-row',
        corner: 'vt-schedule-corner',
        dayHeader: cell('vt-schedule-day-header'),
        dayLink: 'vt-schedule-day-link',
        allDayRow: 'vt-schedule-allday-row',
        gutter: (s: { allDay?: boolean; hour?: boolean }) => ['vt-schedule-gutter', { 'vt-schedule-gutter-allday': s.allDay, 'vt-schedule-hour': s.hour }],
        allDayCell: cell('vt-schedule-allday-cell'),
        allDayLayer: 'vt-schedule-layer vt-schedule-allday-layer',
        body: 'vt-schedule-body',
        slotRow: (s: { hour?: boolean }) => ['vt-schedule-slot-row', { 'vt-schedule-hour': s.hour }],
        hourLabel: 'vt-schedule-hour-label',
        slot: cell('vt-schedule-slot'),
        dayLayer: 'vt-schedule-layer vt-schedule-day-layer',
        now: 'vt-schedule-now',
        monthHeadRow: 'vt-schedule-month-head',
        weekday: 'vt-schedule-weekday',
        monthBody: 'vt-schedule-month-body',
        week: 'vt-schedule-week',
        monthCell: cell('vt-schedule-month-cell'),
        dateLabel: (s: { today?: boolean }) => ['vt-schedule-date', { 'vt-schedule-date-today': s.today }],
        moreButton: 'vt-schedule-more-button',
        weekLayer: 'vt-schedule-layer vt-schedule-week-layer',
        timelineHead: 'vt-schedule-head vt-schedule-timeline-head',
        resourceHeader: 'vt-schedule-resource-header',
        slotHeader: cell('vt-schedule-slot-header'),
        slotDay: 'vt-schedule-slot-day',
        resourceRow: 'vt-schedule-resource-row',
        resourceCell: 'vt-schedule-resource',
        timelineSlot: cell('vt-schedule-timeline-slot'),
        rowLayer: 'vt-schedule-layer vt-schedule-row-layer',
        nowVertical: 'vt-schedule-now vt-schedule-now-vertical',
        agenda: 'vt-schedule-agenda',
        agendaList: 'vt-schedule-agenda-list',
        agendaDay: (s: { today?: boolean }) => ['vt-schedule-agenda-day', { 'vt-schedule-today': s.today }],
        agendaDate: 'vt-schedule-agenda-date',
        agendaEvents: 'vt-schedule-agenda-events',
        agendaItem: 'vt-schedule-agenda-item',
        agendaEmpty: 'vt-schedule-agenda-empty',
        event: (s: ScheduleEventState) => [
            'vt-schedule-event',
            `vt-schedule-event-${s.variant}`,
            {
                'vt-schedule-event-editable': s.editable,
                'vt-schedule-event-dragging': s.dragging,
                'vt-schedule-event-all-day': s.allDay,
                'vt-schedule-event-continues-before': s.continuesBefore,
                'vt-schedule-event-continues-after': s.continuesAfter
            }
        ],
        eventTime: 'vt-schedule-event-time',
        eventTitle: 'vt-schedule-event-title',
        resizer: (s: { edge?: 'bottom' | 'end' }) => ['vt-schedule-resizer', `vt-schedule-resizer-${s.edge}`],
        more: 'vt-schedule-more',
        moreTitle: 'vt-schedule-more-title'
    }
});

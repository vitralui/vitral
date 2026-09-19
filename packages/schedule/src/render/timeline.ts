import { addMinutes, fractionOf, isSameDay, layoutLanes, visuallyHidden } from '@vitral/core';
import { h, mergeAttrs, type Child } from '@vitral/dom';
import type { Occurrence, ScheduleCell } from '../engine/types';
import { content, pct, type ViewContext } from './context';
import { eventView } from './event';

/**
 * The timeline: one row per resource, time running across. A row grows to fit
 * the lanes its overlapping events need; its events are drawn inside its first
 * time cell, over the whole row.
 */

const origin = new Date(0);

const eventStyle = (placement: { left: number; width: number; lane: number }) => ({
    left: pct(placement.left),
    width: `calc(${pct(placement.width)} - var(--vt-schedule-event-gap))`,
    top: `calc(var(--vt-schedule-timeline-row-padding) + ${placement.lane} * (var(--vt-schedule-event-height) + var(--vt-schedule-event-gap)))`
});

export function timelineView(context: ViewContext): Child {
    const { part, locale, settings, days } = context;
    const perDay = settings.maxMinutes - settings.minMinutes;
    const multiDay = days.length > 1;

    const slots: { day: Date; minutes: number; start: Date }[] = [];
    for (const day of days) {
        for (let minutes = settings.minMinutes; minutes < settings.maxMinutes; minutes += settings.timelineSlotMinutes) slots.push({ day, minutes, start: addMinutes(day, minutes) });
    }
    const columns = { 'grid-template-columns': `var(--vt-schedule-timeline-resource-width) repeat(${slots.length}, minmax(var(--vt-schedule-timeline-slot-width), 1fr))` };

    /**
     * Hidden hours split the axis per day; the layout runs on a continuous axis
     * made of the visible stretches laid end to end.
     */
    function axis(date: Date, clampEnd: boolean): number {
        const first = days[0]!;
        let index = days.findIndex((day) => isSameDay(day, date));
        if (index < 0) return date < first ? 0 : days.length * perDay;
        const minutes = (date.getTime() - addMinutes(days[index]!, 0).getTime()) / 60_000;
        let within = Math.min(Math.max(minutes - settings.minMinutes, 0), perDay);
        if (clampEnd && within === 0 && minutes <= settings.minMinutes && index > 0) {
            index -= 1;
            within = perDay;
        }
        return index * perDay + within;
    }

    const axisEnd = new Date(days.length * perDay * 60_000);
    const toAxis = (occurrence: Occurrence) => ({ start: new Date(axis(occurrence.start, false) * 60_000), end: new Date(axis(occurrence.end, true) * 60_000) });

    const rows = context.resources.map((resource) => {
        const list = context.occurrences.filter((occurrence) => occurrence.resourceId === resource.id && occurrence.start < context.range.end && occurrence.end > context.range.start);
        const placed = layoutLanes<Occurrence>(list, toAxis, origin, axisEnd).filter((placement) => placement.width > 0);
        return { resource, placed, lanes: placed.reduce((lanes, placement) => Math.max(lanes, placement.lane + 1), 1) };
    });

    function nowLeft(): number | null {
        if (!settings.nowIndicator) return null;
        const now = context.now;
        if (!days.some((day) => isSameDay(day, now))) return null;
        const minutes = now.getHours() * 60 + now.getMinutes() - settings.minMinutes;
        if (minutes < 0 || minutes >= perDay) return null;
        return fractionOf(new Date(axis(now, false) * 60_000), origin, axisEnd);
    }

    const cellOf = (slot: { start: Date }, resource: number): ScheduleCell => ({ start: slot.start, span: settings.timelineSlotMinutes, allDay: false, resource });
    const firstOfDay = (slot: { minutes: number }) => slot.minutes === settings.minMinutes;
    const now = nowLeft();

    return h(
        'div',
        mergeAttrs({ key: 'timeline' }, context.gridAttrs(), part('grid', { view: 'timeline' }), { style: { 'max-height': settings.scrollHeight }, ref: context.on.scroller }),
        h(
            'div',
            mergeAttrs({ key: 'head', role: 'rowgroup' }, part('timelineHead')),
            h(
                'div',
                mergeAttrs({ role: 'row' }, part('headRow'), { style: columns }),
                h('div', mergeAttrs({ key: 'resources', role: 'columnheader' }, part('resourceHeader')), locale.schedule.resources),
                slots.map((slot) =>
                    h(
                        'div',
                        mergeAttrs({ key: slot.start.getTime(), role: 'columnheader' }, part('slotHeader', { dayStart: firstOfDay(slot) })),
                        multiDay && firstOfDay(slot) ? h('span', mergeAttrs({ key: 'day' }, part('slotDay')), context.format(slot.day, locale.schedule.dayHeader)) : null,
                        h('span', { key: 'time', 'aria-hidden': 'true' }, context.formatTime(slot.start)),
                        h('span', { key: 'name', style: visuallyHidden }, `${multiDay ? `${context.format(slot.day, locale.schedule.dayTitle)}, ` : ''}${context.formatTime(slot.start)}`)
                    )
                )
            )
        ),
        h(
            'div',
            { key: 'body', role: 'rowgroup' },
            rows.map((row, index) =>
                h(
                    'div',
                    mergeAttrs({ key: row.resource.id, role: 'row' }, part('resourceRow'), { style: { ...columns, '--vt-schedule-rows': String(row.lanes) } }),
                    h(
                        'div',
                        mergeAttrs({ key: 'resource', role: 'rowheader' }, part('resourceCell')),
                        content(context.config.content?.resource?.({ resource: row.resource })) ?? row.resource.title
                    ),
                    slots.map((slot, column) => {
                        const cell = cellOf(slot, index);
                        return h(
                            'div',
                            mergeAttrs(
                                { key: slot.start.getTime(), role: 'gridcell' },
                                context.cellAttrs(cell),
                                part('timelineSlot', {
                                    business: context.isBusiness(slot.start, addMinutes(slot.start, settings.timelineSlotMinutes)),
                                    dayStart: firstOfDay(slot),
                                    selected: context.isSelected(cell),
                                    focused: context.isFocused(cell)
                                }),
                                { 'aria-label': context.cellLabel(cell) }
                            ),
                            column === 0
                                ? h(
                                      'div',
                                      mergeAttrs({ key: 'layer', 'data-vt-layer': '' }, part('rowLayer')),
                                      row.placed.map((placement) =>
                                          eventView(context, placement.item, {
                                              variant: 'lane',
                                              continuesBefore: placement.clippedStart,
                                              continuesAfter: placement.clippedEnd,
                                              resize: placement.clippedEnd ? null : 'end',
                                              style: eventStyle(placement)
                                          })
                                      ),
                                      now !== null ? h('div', mergeAttrs({ key: 'now', 'aria-hidden': 'true' }, part('nowVertical'), { style: { left: pct(now) } })) : null
                                  )
                                : null
                        );
                    })
                )
            )
        )
    );
}

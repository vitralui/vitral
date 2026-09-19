import { addDays, formatMessage, isSameDay, layoutDaySpans, visuallyHidden, weekdayOrder } from '@vitral/core';
import { h, mergeAttrs, type Child } from '@vitral/dom';
import type { Occurrence, ScheduleCell } from '../engine/types';
import { pct, type ViewContext } from './context';
import { eventView } from './event';

/**
 * The month view: six weeks as rows of day cells. Every event covering a day
 * is a bar across the week, a timed one included, packed into rows. A day with
 * more than `maxEventsPerDay` shows a "+N more" button that lists them all.
 */

const rowTop = (row: number) => `calc(var(--vt-schedule-month-date-height) + ${row} * (var(--vt-schedule-event-height) + var(--vt-schedule-event-gap)))`;

const spanStyle = (placement: { first: number; last: number; row: number }) => ({
    left: pct(placement.first / 7),
    width: `calc(${pct((placement.last - placement.first + 1) / 7)} - var(--vt-schedule-event-gap))`,
    top: rowTop(placement.row)
});

const moreStyle = (row: number, day: number) => ({ top: rowTop(row), left: pct(day / 7), width: `calc(${pct(1 / 7)} - var(--vt-schedule-event-gap))` });

const cellOf = (day: Date): ScheduleCell => ({ start: day, span: 1440, allDay: true, resource: 0 });

/** One week: which bars are drawn, which are left over, and where the button goes. */
function weekOf(context: ViewContext, index: number) {
    const start = addDays(context.range.start, index * 7);
    const days = Array.from({ length: 7 }, (_, day) => addDays(start, day));
    const end = addDays(start, 7);
    const max = context.settings.maxEventsPerDay;
    const list = context.occurrences.filter((occurrence) => occurrence.start < end && occurrence.end > start);
    const spans = layoutDaySpans<Occurrence>(list, (occurrence) => occurrence, start, 7);
    const counts = days.map((_, day) => spans.filter((placement) => placement.first <= day && placement.last >= day).length);
    // A day that overflows gives up its last row to the "+N more" button.
    const limits = counts.map((count) => (count > max ? max - 1 : max));
    const shown = spans.filter((placement) => placement.row < Math.min(...limits.slice(placement.first, placement.last + 1)));
    const hidden = days.map((_, day) => counts[day]! - shown.filter((placement) => placement.first <= day && placement.last >= day).length);
    return { start, days, shown, hidden, limits };
}

export function monthView(context: ViewContext): Child {
    const { part, locale } = context;
    const month = addDays(context.range.start, 15).getMonth();
    const isToday = (day: Date) => isSameDay(day, context.today);
    const weekdays = weekdayOrder(context.settings.firstDay).map((day) => ({ day, short: locale.dayNamesShort[day] ?? '', long: locale.dayNames[day] ?? '' }));

    return h(
        'div',
        mergeAttrs({ key: 'month' }, context.gridAttrs(), part('grid', { view: 'month' }), { style: { '--vt-schedule-rows': String(context.settings.maxEventsPerDay) } }),
        h(
            'div',
            mergeAttrs({ key: 'head', role: 'rowgroup' }, part('head')),
            h(
                'div',
                mergeAttrs({ role: 'row' }, part('monthHeadRow')),
                weekdays.map((weekday) =>
                    h(
                        'div',
                        mergeAttrs({ key: weekday.day, role: 'columnheader' }, part('weekday')),
                        h('abbr', { title: weekday.long, 'aria-hidden': 'true' }, weekday.short),
                        h('span', { style: visuallyHidden }, weekday.long)
                    )
                )
            )
        ),
        h(
            'div',
            mergeAttrs({ key: 'body', role: 'rowgroup' }, part('monthBody')),
            Array.from({ length: 6 }, (_, index) => {
                const week = weekOf(context, index);
                return h(
                    'div',
                    mergeAttrs({ key: week.start.getTime(), role: 'row' }, part('week')),
                    week.days.map((day, column) => {
                        const cell = cellOf(day);
                        return h(
                            'div',
                            mergeAttrs(
                                { key: day.getTime(), role: 'gridcell' },
                                context.cellAttrs(cell),
                                part('monthCell', {
                                    today: isToday(day),
                                    otherMonth: day.getMonth() !== month,
                                    selected: context.isSelected(cell),
                                    focused: context.isFocused(cell),
                                    weekend: day.getDay() === 0 || day.getDay() === 6
                                }),
                                { 'aria-current': isToday(day) ? 'date' : undefined }
                            ),
                            h('span', { key: 'name', style: visuallyHidden }, context.cellLabel(cell)),
                            h('span', mergeAttrs({ key: 'date', 'aria-hidden': 'true' }, part('dateLabel', { today: isToday(day) })), String(day.getDate())),
                            week.hidden[column]! > 0
                                ? h(
                                      'button',
                                      mergeAttrs({ key: 'more', type: 'button' }, part('moreButton'), {
                                          style: moreStyle(week.limits[column]!, column),
                                          'aria-label': formatMessage(locale.schedule.moreLabel, { count: week.hidden[column]!, date: context.format(day, locale.schedule.dayTitle) }),
                                          'aria-haspopup': 'dialog',
                                          onClick: (event: MouseEvent) => context.on.showMore(event, day)
                                      }),
                                      formatMessage(locale.schedule.more, { count: week.hidden[column]! })
                                  )
                                : null,
                            // Every bar of the week is drawn in its first cell, over the row.
                            column === 0
                                ? h(
                                      'div',
                                      mergeAttrs({ key: 'layer', 'data-vt-layer': '' }, part('weekLayer')),
                                      week.shown.map((placement) =>
                                          eventView(context, placement.item, {
                                              key: `${placement.item.key}-${index}`,
                                              variant: 'span',
                                              continuesBefore: placement.continuesBefore,
                                              continuesAfter: placement.continuesAfter,
                                              resize: placement.continuesAfter ? null : 'end',
                                              style: spanStyle(placement)
                                          })
                                      )
                                  )
                                : null
                        );
                    })
                );
            })
        )
    );
}

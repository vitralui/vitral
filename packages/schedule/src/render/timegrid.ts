import { addMinutes, fractionOf, isSameDay, layoutDaySpans, layoutTimedEvents, visuallyHidden } from '@vitral/core';
import { h, mergeAttrs, type Child } from '@vitral/dom';
import type { Occurrence, ScheduleCell } from '../engine/types';
import { pct, type ViewContext } from './context';
import { eventView } from './event';

/**
 * The week and day views: a grid whose rows are time slots and whose columns
 * are days, under a header row and an all-day row. Each layer of events is
 * drawn inside the first cell of the row it covers, positioned over them, so
 * the grid holds only rows and cells and the events stay in it.
 */

const spanStyle = (placement: { first: number; last: number; row: number }, days: number) => ({
    left: pct(placement.first / days),
    width: `calc(${pct((placement.last - placement.first + 1) / days)} - var(--vt-schedule-event-gap))`,
    top: `calc(${placement.row} * (var(--vt-schedule-event-height) + var(--vt-schedule-event-gap)))`
});

const timedStyle = (placement: { top: number; height: number; column: number; columns: number; span: number }) => ({
    top: pct(placement.top),
    height: pct(placement.height),
    left: pct(placement.column / placement.columns),
    width: `calc(${pct(placement.span / placement.columns)} - var(--vt-schedule-event-gap))`
});

export function timeGridView(context: ViewContext): Child {
    const { part, locale, settings, days } = context;
    const columns = { 'grid-template-columns': `var(--vt-schedule-gutter-width) repeat(${days.length}, minmax(0, 1fr))` };
    const slots: number[] = [];
    for (let minutes = settings.minMinutes; minutes < settings.maxMinutes; minutes += settings.slotMinutes) slots.push(minutes);
    const bodyHeight = `calc(${slots.length} * var(--vt-schedule-slot-height))`;

    const cellOf = (day: Date, minutes: number): ScheduleCell => ({ start: addMinutes(day, minutes), span: settings.slotMinutes, allDay: false, resource: 0 });
    const dayCell = (day: Date): ScheduleCell => ({ start: day, span: 1440, allDay: true, resource: 0 });
    const isToday = (day: Date) => isSameDay(day, context.today);
    const weekend = (day: Date) => day.getDay() === 0 || day.getDay() === 6;
    const canOpenDay = days.length > 1 && context.views.includes('day');
    const hourLabel = (minutes: number) => context.formatTime(addMinutes(days[0]!, minutes));

    const allDay = layoutDaySpans(
        context.occurrences.filter((occurrence) => occurrence.allDay),
        (occurrence) => occurrence,
        days[0]!,
        days.length
    );
    const allDayRows = allDay.reduce((rows, placement) => Math.max(rows, placement.row + 1), 0);

    const timed = days.map((day) => {
        const from = addMinutes(day, settings.minMinutes);
        const to = addMinutes(day, settings.maxMinutes);
        const list = context.occurrences.filter((occurrence) => !occurrence.allDay && occurrence.start < to && occurrence.end > from);
        return layoutTimedEvents<Occurrence>(list, (occurrence) => occurrence, from, to, Math.min(15, settings.slotMinutes));
    });

    const layerStyle = (index: number) => ({
        left: `calc(var(--vt-schedule-gutter-width) + (100% - var(--vt-schedule-gutter-width)) * ${index} / ${days.length})`,
        width: `calc((100% - var(--vt-schedule-gutter-width)) / ${days.length})`,
        height: bodyHeight
    });

    function nowAt(day: Date): number | null {
        if (!settings.nowIndicator || !isSameDay(day, context.now)) return null;
        return fractionOf(context.now, addMinutes(day, settings.minMinutes), addMinutes(day, settings.maxMinutes));
    }

    return h(
        'div',
        mergeAttrs({ key: `grid-${context.models.view}` }, context.gridAttrs(), part('grid', { view: context.models.view })),
        h(
            'div',
            mergeAttrs({ key: 'head', role: 'rowgroup' }, part('head')),
            h(
                'div',
                mergeAttrs({ key: 'head-row', role: 'row' }, part('headRow'), { style: columns }),
                h('div', mergeAttrs({ key: 'corner', role: 'columnheader' }, part('corner')), h('span', { style: visuallyHidden }, locale.schedule.time)),
                days.map((day) =>
                    h(
                        'div',
                        mergeAttrs({ key: day.getTime(), role: 'columnheader' }, part('dayHeader', { today: isToday(day), weekend: weekend(day) }), {
                            'aria-current': isToday(day) ? 'date' : undefined
                        }),
                        canOpenDay
                            ? h(
                                  'button',
                                  mergeAttrs({ type: 'button' }, part('dayLink'), {
                                      'aria-label': context.format(day, locale.schedule.dayTitle),
                                      onClick: () => context.on.gotoDay(day)
                                  }),
                                  context.format(day, locale.schedule.dayHeader)
                              )
                            : [
                                  h('span', { key: 'short', 'aria-hidden': 'true' }, context.format(day, locale.schedule.dayHeader)),
                                  h('span', { key: 'long', style: visuallyHidden }, context.format(day, locale.schedule.dayTitle))
                              ]
                    )
                )
            ),
            h(
                'div',
                mergeAttrs({ key: 'allday-row', role: 'row' }, part('allDayRow'), { style: { ...columns, '--vt-schedule-rows': String(Math.max(1, allDayRows)) } }),
                h('div', mergeAttrs({ key: 'gutter', role: 'rowheader' }, part('gutter', { allDay: true })), locale.schedule.allDay),
                days.map((day, index) => {
                    const cell = dayCell(day);
                    return h(
                        'div',
                        mergeAttrs(
                            { key: day.getTime(), role: 'gridcell' },
                            context.cellAttrs(cell),
                            part('allDayCell', { today: isToday(day), selected: context.isSelected(cell), focused: context.isFocused(cell) }),
                            { 'aria-label': `${context.cellLabel(cell)}, ${locale.schedule.allDay}` }
                        ),
                        index === 0
                            ? h(
                                  'div',
                                  mergeAttrs({ key: 'layer', 'data-vt-layer': '' }, part('allDayLayer')),
                                  allDay.map((placement) =>
                                      eventView(context, placement.item, {
                                          variant: 'span',
                                          continuesBefore: placement.continuesBefore,
                                          continuesAfter: placement.continuesAfter,
                                          resize: placement.continuesAfter ? null : 'end',
                                          style: spanStyle(placement, days.length)
                                      })
                                  )
                              )
                            : null
                    );
                })
            )
        ),
        h(
            'div',
            mergeAttrs({ key: 'body', role: 'rowgroup' }, part('body'), { style: { 'max-height': settings.scrollHeight }, ref: context.on.scroller }),
            slots.map((minutes, row) =>
                h(
                    'div',
                    mergeAttrs({ key: minutes, role: 'row' }, part('slotRow', { hour: minutes % 60 === 0 }), { style: columns }),
                    h(
                        'div',
                        mergeAttrs({ key: 'gutter', role: 'rowheader' }, part('gutter', { hour: minutes % 60 === 0 })),
                        minutes % 60 === 0 && row > 0 ? h('span', mergeAttrs({ key: 'label', 'aria-hidden': 'true' }, part('hourLabel')), hourLabel(minutes)) : null,
                        h('span', { key: 'name', style: visuallyHidden }, hourLabel(minutes))
                    ),
                    days.map((day, column) => {
                        const cell = cellOf(day, minutes);
                        return h(
                            'div',
                            mergeAttrs(
                                { key: day.getTime(), role: 'gridcell' },
                                context.cellAttrs(cell),
                                part('slot', {
                                    business: context.isBusiness(cell.start, addMinutes(cell.start, settings.slotMinutes)),
                                    today: isToday(day),
                                    hour: minutes % 60 === 0,
                                    selected: context.isSelected(cell),
                                    focused: context.isFocused(cell)
                                }),
                                { 'aria-label': context.cellLabel(cell) }
                            ),
                            row === 0
                                ? h(
                                      'div',
                                      mergeAttrs({ key: 'layer', 'data-vt-layer': '' }, part('dayLayer'), { style: layerStyle(column) }),
                                      timed[column]!.map((placement) =>
                                          eventView(context, placement.item, {
                                              variant: 'timed',
                                              continuesBefore: placement.clippedStart,
                                              continuesAfter: placement.clippedEnd,
                                              resize: placement.clippedEnd ? null : 'bottom',
                                              style: timedStyle(placement)
                                          })
                                      ),
                                      nowAt(day) !== null ? h('div', mergeAttrs({ key: 'now', 'aria-hidden': 'true' }, part('now'), { style: { top: pct(nowAt(day)!) } })) : null
                                  )
                                : null
                        );
                    })
                )
            )
        )
    );
}

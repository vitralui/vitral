import { isSameDay } from '@vitral/core';
import { h, mergeAttrs, type Child } from '@vitral/dom';
import { eventsOnDay } from '../engine/state';
import { content, type ViewContext } from './context';
import { eventView } from './event';

/**
 * The agenda: the days of the range that have something on, each a heading
 * over a list of its events, in order. A multi-day event is listed on each of
 * its days.
 */
export function agendaView(context: ViewContext): Child {
    const { part, locale } = context;
    const groups = context.days.map((day) => ({ day, items: eventsOnDay(context.occurrences, day) })).filter((group) => group.items.length > 0);
    if (!groups.length) {
        return h('div', mergeAttrs({ key: 'agenda' }, part('agenda')), h('div', part('agendaEmpty'), content(context.config.content?.empty?.()) ?? locale.schedule.noEvents));
    }
    return h(
        'div',
        mergeAttrs({ key: 'agenda' }, part('agenda')),
        h(
            'ul',
            part('agendaList'),
            groups.map((group) => {
                const today = isSameDay(group.day, context.today);
                return h(
                    'li',
                    mergeAttrs({ key: group.day.getTime() }, part('agendaDay', { today })),
                    h(
                        'div',
                        mergeAttrs({ key: 'date', role: 'heading', 'aria-level': '3' }, part('agendaDate'), { 'aria-current': today ? 'date' : undefined }),
                        context.format(group.day, locale.schedule.dayTitle)
                    ),
                    h(
                        'ul',
                        mergeAttrs({ key: 'events' }, part('agendaEvents')),
                        group.items.map((occurrence) => h('li', mergeAttrs({ key: occurrence.key }, part('agendaItem')), eventView(context, occurrence, { variant: 'list' })))
                    )
                );
            })
        )
    );
}

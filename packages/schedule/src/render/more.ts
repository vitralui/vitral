import { h, mergeAttrs, type VElement } from '@vitral/dom';
import { eventsOnDay } from '../engine/state';
import type { ViewContext } from './context';
import { eventView } from './event';

/**
 * Everything on one day, for a month cell that had no room for it. The handle
 * puts it in an overlay hanging from the button that asked.
 */
export function moreView(context: ViewContext, day: Date): VElement {
    const { part, locale } = context;
    const title = context.format(day, locale.schedule.dayTitle);
    return h(
        'div',
        mergeAttrs({ id: context.ids.more, role: 'dialog' }, part('more'), { 'aria-label': title }),
        h('div', mergeAttrs({ key: 'title' }, part('moreTitle')), title),
        eventsOnDay(context.occurrences, day).map((occurrence) => eventView(context, occurrence, { variant: 'list' }))
    ) as VElement;
}

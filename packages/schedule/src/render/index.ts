import { visuallyHidden } from '@vitral/core';
import { h, mergeAttrs, type Child } from '@vitral/dom';
import { agendaView } from './agenda';
import type { ViewContext } from './context';
import { monthView } from './month';
import { timeGridView } from './timegrid';
import { timelineView } from './timeline';
import { toolbarView } from './toolbar';

/**
 * The schedule as plain objects: the toolbar, the view on show, the two texts
 * that tell a reader what the keyboard does, and the live region that says
 * what changed. What is drawn is decided here; what happens when it is pressed
 * is the handle's.
 */
export function scheduleView(context: ViewContext): Child[] {
    const { part, locale } = context;
    const view = context.models.view;
    return [
        toolbarView(context),
        view === 'month' ? monthView(context) : view === 'timeline' ? timelineView(context) : view === 'agenda' ? agendaView(context) : timeGridView(context),
        h('span', { key: 'grid-help', id: context.ids.gridHelp, hidden: true }, locale.schedule.gridInstructions),
        h('span', { key: 'event-help', id: context.ids.eventHelp, hidden: true }, locale.schedule.eventInstructions),
        h(
            'span',
            mergeAttrs({ key: 'status', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }, part('status'), { style: visuallyHidden }),
            context.announcement
        )
    ];
}

export { agendaView, monthView, timeGridView, timelineView, toolbarView };
export * from './context';
export * from './event';
export { iconView } from './icon';

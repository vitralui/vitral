# @vitral/schedule

A calendar and scheduler with no framework in it: the engine and a DOM
renderer, which the Vitral components wrap.

Month, week, day, agenda and timeline. The grids are WAI-ARIA grids named by
the period on show: one cell holds the tab stop and the arrow keys move it,
Shift with the arrows selects a range and Enter picks it — the keyboard way to
drag across empty time. Events are buttons named by their title and full time;
Alt with the arrows moves one and Alt+Shift changes its end, and each change is
announced.

```ts
import { createSchedule } from '@vitral/schedule';

const schedule = createSchedule(element, {
    view: 'week',
    date: new Date(),
    events: [{ id: 1, title: 'Standup', start: '2026-09-14T09:00', end: '2026-09-14T09:15', recurrence: 'FREQ=WEEKLY;BYDAY=MO,WE' }],
    on: {
        'event-change': ({ start, end, revert }) => save(start, end).catch(revert),
        'range-change': (range) => fetchEvents(range)
    }
});

schedule.update({ events });
schedule.destroy();
```

A pointer drags events, their end edge, and empty time. Every change is shown
at once and reported with a `revert()`, so an application that refuses one puts
it back. Recurring events are expanded from an RRULE; all dates are local, and
nothing here converts time zones.

`@vitral/schedule/engine` is the arithmetic on its own: which views, which
period, what is on in it, and what everything is called. No DOM, no timers.

**[Documentation](https://vitralui.github.io/vitral/#/components/schedule)**

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.

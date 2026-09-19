import { definePart } from '../../base/parts';

/**
 * The schedule's content, written as children rather than as named slots:
 * `<Schedule.Toolbar>`, `<Schedule.Event>`, `<Schedule.Resource>`,
 * `<Schedule.Empty>`. Each draws nothing itself — the schedule takes what is
 * inside it and places it where that part belongs, with the same slot props.
 */
export const ScheduleToolbar = definePart('Toolbar', 'VtScheduleToolbar');
/** `Schedule.Event`. The plain name belongs to the event type an application writes. */
export const ScheduleEventPart = definePart('Event', 'VtScheduleEvent');
export const ScheduleResource = definePart('Resource', 'VtScheduleResource');
export const ScheduleEmpty = definePart('Empty', 'VtScheduleEmpty');

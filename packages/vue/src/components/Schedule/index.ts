import ScheduleVue from './Schedule.vue';
import { ScheduleEmpty, ScheduleEventPart, ScheduleResource, ScheduleToolbar } from './parts';

/**
 * The schedule, and as properties the parts a template composes it from:
 * `<Schedule.Toolbar>`, `<Schedule.Event>`… `Root` is the schedule itself.
 * Each part is also a named export (`ScheduleToolbar`, `ScheduleEvent`…).
 */
export const Schedule = /* @__PURE__ */ Object.assign(ScheduleVue, {
    Root: ScheduleVue,
    Toolbar: ScheduleToolbar,
    Event: ScheduleEventPart,
    Resource: ScheduleResource,
    Empty: ScheduleEmpty
});

export { ScheduleToolbar, ScheduleEventPart, ScheduleResource, ScheduleEmpty };
export type * from './types';

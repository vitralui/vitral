// Time & calendar: clocks, timers and dates.
// Drawn on the 24×24 grid: 2-unit round strokes, no fill, about 2 units of margin.
import type { IconDef } from '../types';

const category = 'time';

export const calendar: IconDef = { name: 'calendar', category, tags: ['date', 'schedule', 'event'], body: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/>' };
export const calendarDays: IconDef = { name: 'calendarDays', category, tags: ['month', 'dates', 'planner'], body: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>' };
export const calendarCheck: IconDef = { name: 'calendarCheck', category, tags: ['booked', 'confirmed date'], body: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/><path d="M9 16l2 2 4-4"/>' };
export const calendarPlus: IconDef = { name: 'calendarPlus', category, tags: ['new event', 'add date'], body: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/><path d="M12 13v6M9 16h6"/>' };
export const calendarX: IconDef = { name: 'calendarX', category, tags: ['cancelled event', 'remove date'], body: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/><path d="M10 14l4 4M14 14l-4 4"/>' };
export const calendarClock: IconDef = { name: 'calendarClock', category, tags: ['schedule', 'appointment', 'reminder'], body: '<path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5M3 10h7M8 2v4M16 2v4"/><circle cx="16.5" cy="16.5" r="5"/><path d="M16.5 14.5v2l1.5 1"/>' };
export const calendarRange: IconDef = { name: 'calendarRange', category, tags: ['period', 'dates', 'span'], body: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/><path d="M7 14h4M13 18h4"/>' };
export const clock: IconDef = { name: 'clock', category, tags: ['time', 'hour', 'watch'], body: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>' };
export const alarmClock: IconDef = { name: 'alarmClock', category, tags: ['wake up', 'reminder', 'alarm'], body: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M5 3L2 6M22 6l-3-3M6.4 19.6L4 22M17.6 19.6L20 22"/>' };
export const timer: IconDef = { name: 'timer', category, tags: ['stopwatch', 'countdown', 'duration'], body: '<circle cx="12" cy="14" r="8"/><path d="M10 2h4M12 14l3-3M12 2v4"/>' };
export const hourglass: IconDef = { name: 'hourglass', category, tags: ['wait', 'loading', 'sand timer'], body: '<path d="M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/>' };
export const history: IconDef = { name: 'history', category, tags: ['recent', 'back in time', 'log'], body: '<path d="M3 12a9 9 0 1 0 2.6-6.4L3 8.2M3 3v5.2h5.2M12 7v5l3.5 2"/>' };
export const clockAlert: IconDef = { name: 'clockAlert', category, tags: ['late', 'overdue', 'deadline'], body: '<path d="M12 6v6l4 2M20 12v5M20 21h.01M21.5 8.5A10 10 0 1 0 16 21.2"/>' };
export const clockCheck: IconDef = { name: 'clockCheck', category, tags: ['on time', 'done'], body: '<path d="M12 6v6l3 1.5M22 12.5A10 10 0 1 0 13 22M16 19l2 2 4-4"/>' };
export const watchFace: IconDef = { name: 'watchFace', category, tags: ['time', 'analog'], body: '<circle cx="12" cy="12" r="6"/><path d="M12 10v2l1 1M9 6.3L9.5 2h5l.5 4.3M9 17.7l.5 4.3h5l.5-4.3"/>' };
export const sunrise: IconDef = { name: 'sunrise', category, tags: ['morning', 'dawn'], body: '<path d="M12 2v6M8 6l4-4 4 4M4.2 10.2l1.4 1.4M2 18h2M20 18h2M18.4 11.6l1.4-1.4M22 22H2M16 18a4 4 0 0 0-8 0"/>' };
export const sunset: IconDef = { name: 'sunset', category, tags: ['evening', 'dusk'], body: '<path d="M12 9V3M8 5l4 4 4-4M4.2 10.2l1.4 1.4M2 18h2M20 18h2M18.4 11.6l1.4-1.4M22 22H2M16 18a4 4 0 0 0-8 0"/>' };
export const timerReset: IconDef = { name: 'timerReset', category, tags: ['restart', 'countdown'], body: '<path d="M10 2h4M12 14v-4M4 13a8 8 0 0 1 8-7 8 8 0 1 1-5.3 14L4 17.6M9 17H4v5"/>' };
export const calendarHeart: IconDef = { name: 'calendarHeart', category, tags: ['date night', 'anniversary'], body: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/><path d="M12 19s-3.5-2-3.5-4a1.8 1.8 0 0 1 3.5-.6 1.8 1.8 0 0 1 3.5.6c0 2-3.5 4-3.5 4z"/>' };

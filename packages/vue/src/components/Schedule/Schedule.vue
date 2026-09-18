<script setup lang="ts">
import {
    addDays,
    addMinutes,
    calendarKeyTarget,
    dayDiff,
    expandEvents,
    formatDate,
    formatMessage,
    formatTime,
    isBusinessTime,
    isClient,
    isSameDay,
    minutesOfDay,
    parseTime,
    shiftDays,
    snapMinutes,
    startOfDay,
    stepViewDate,
    timeGridKeyTarget,
    viewRange,
    visuallyHidden
} from '@vitral/core';
import { scheduleStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, onBeforeUnmount, provide, reactive, ref, shallowRef, useId, watch } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { usePointerDrag } from '../../base/usePointerDrag';
import Button from '../Button/Button.vue';
import Popover from '../Popover/Popover.vue';
import { scheduleKey, type Occurrence, type ScheduleCell, type ScheduleContext } from './context';
import ScheduleAgenda from './ScheduleAgenda.vue';
import ScheduleEventView from './ScheduleEventView.vue';
import ScheduleMonth from './ScheduleMonth.vue';
import ScheduleTimeGrid from './ScheduleTimeGrid.vue';
import ScheduleTimeline from './ScheduleTimeline.vue';
import type { ScheduleEmits, ScheduleOccurrenceInfo, ScheduleProps, ScheduleSlots, ScheduleViewName } from './types';

// A calendar and scheduler. Month, week, day and timeline are WAI-ARIA grids
// named by the period on show: one cell holds the tab stop and the arrow keys
// move it (Page Up/Down change the period), Shift with the arrows selects a
// range and Enter picks it — the keyboard way to drag across empty time.
// Events are buttons named by their title and full time; Alt with the arrows
// moves one and Alt+Shift changes its end, the keyboard way to drag and
// resize, and each change is announced. A pointer drags events, their end
// edge, and empty time. Every change is shown at once and reported through
// `event-change` with a `revert()`. The date maths, recurrence and layout
// are core's; all dates are local.

defineOptions({ name: 'VtSchedule', inheritAttrs: false });

const props = withDefaults(defineProps<ScheduleProps>(), {
    unstyled: undefined,
    events: () => [],
    resources: () => [],
    toolbar: true,
    slotDuration: 30,
    timelineSlotDuration: 60,
    snapDuration: 15,
    minTime: '00:00',
    maxTime: '24:00',
    scrollTime: '08:00',
    businessHours: () => ({}),
    hour12: undefined,
    editable: true,
    selectable: true,
    nowIndicator: true,
    defaultDuration: 60,
    agendaDays: 7,
    timelineDays: 1,
    maxEventsPerDay: 3,
    scrollHeight: '36rem'
});
const view = defineModel<ScheduleViewName>('view', { default: 'week' });
const date = defineModel<Date>('date', { default: () => startOfDay(new Date()) });
const emit = defineEmits<ScheduleEmits>();
const slots = defineSlots<ScheduleSlots>();

const { part, locale } = useComponent(scheduleStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();
const id = useId();
const titleId = `${id}-title`;
const instructionsId = `${id}-help`;
const eventInstructionsId = `${id}-event-help`;

const announcement = ref('');
function announce(text: string) {
    announcement.value = '';
    nextTick(() => (announcement.value = text));
}

// ---- time ------------------------------------------------------------------------

const today = ref(startOfDay(new Date()));
const now = ref(new Date());
const clock = isClient
    ? setInterval(() => {
          now.value = new Date();
          if (!isSameDay(now.value, today.value)) today.value = startOfDay(now.value);
      }, 30_000)
    : undefined;
onBeforeUnmount(() => clearInterval(clock));

const firstDay = computed(() => props.firstDayOfWeek ?? locale.value.firstDayOfWeek);
const minMinutes = computed(() => Math.max(0, Math.min(1439, parseTime(props.minTime, 0))));
const maxMinutes = computed(() => Math.max(minMinutes.value + 1, Math.min(1440, parseTime(props.maxTime, 1440))));
const slotMinutes = computed(() => Math.max(1, props.slotDuration));
const timelineSlotMinutes = computed(() => Math.max(1, props.timelineSlotDuration));
const snap = computed(() => Math.max(1, props.snapDuration));
const current = computed(() => (date.value instanceof Date && !Number.isNaN(date.value.getTime()) ? date.value : today.value));

const views = computed<ScheduleViewName[]>(() => props.views ?? (props.resources.length ? ['month', 'week', 'day', 'agenda', 'timeline'] : ['month', 'week', 'day', 'agenda']));
const daysFor = (v: ScheduleViewName) => (v === 'agenda' ? props.agendaDays : v === 'timeline' ? props.timelineDays : undefined);
const range = computed(() => viewRange(view.value, current.value, { firstDayOfWeek: firstDay.value, days: daysFor(view.value) }));
const days = computed(() => Array.from({ length: dayDiff(range.value.start, range.value.end) }, (_, i) => addDays(range.value.start, i)));

watch(
    () => [range.value.start.getTime(), range.value.end.getTime(), view.value] as const,
    () => emit('range-change', { ...range.value, view: view.value }),
    { immediate: true }
);

const format = (d: Date, pattern: string) => formatDate(d, pattern, locale.value);
const fmtTime = (d: Date) => formatTime(d, locale.value.code, props.hour12);

const title = computed(() => {
    const s = locale.value.schedule;
    const { start, end } = range.value;
    const last = addDays(end, -1);
    if (view.value === 'month') return format(current.value, s.monthTitle);
    if (isSameDay(start, last)) return format(start, s.dayTitle);
    return formatMessage(s.range, { start: format(start, s.rangeDate), end: format(last, s.rangeDate) });
});

// ---- navigation ------------------------------------------------------------------

function setDate(next: Date) {
    date.value = next;
}

function prev() {
    setDate(stepViewDate(view.value, current.value, -1, { days: daysFor(view.value) }));
}
function next() {
    setDate(stepViewDate(view.value, current.value, 1, { days: daysFor(view.value) }));
}
function goToday() {
    today.value = startOfDay(new Date());
    setDate(today.value);
    focus.value = { ...focus.value, date: timed.value ? atFocusTime(today.value) : today.value };
}
function setView(v: ScheduleViewName) {
    view.value = v;
}
function gotoDay(day: Date) {
    setDate(startOfDay(day));
    if (views.value.includes('day')) setView('day');
}

// ---- events ----------------------------------------------------------------------

interface Override {
    start: Date;
    end: Date;
    allDay: boolean;
    resourceId?: string | number | null;
}

const overrides = reactive(new Map<string, Override>());
watch(
    () => props.events,
    () => overrides.clear()
);

interface Drag {
    key: string;
    kind: 'move' | 'resize';
    origin: Occurrence;
    anchor: ScheduleCell & { at: Date };
    preview: Override;
}
const drag = shallowRef<Drag | null>(null);

const base = computed<Occurrence[]>(() => {
    const { start, end } = range.value;
    return expandEvents(props.events, start, end, props.defaultDuration).map((occ) => {
        const o = overrides.get(occ.key);
        return o ? { ...occ, ...o } : occ;
    });
});

const occurrences = computed<Occurrence[]>(() => {
    const d = drag.value;
    if (!d) return base.value;
    return base.value.map((occ) => (occ.key === d.key ? { ...occ, ...d.preview } : occ));
});

const resources = computed(() => props.resources);
const resourceIndex = (id: string | number | null | undefined) => props.resources.findIndex((r) => r.id === id);

function colorOf(occ: Occurrence) {
    if (occ.event.color) return occ.event.color;
    const r = resourceIndex(occ.resourceId);
    if (r >= 0 && props.resources[r]!.color) return props.resources[r]!.color!;
    return `var(--vt-chart-${((r >= 0 ? r : occ.index) % 8) + 1})`;
}

const titleOf = (occ: Occurrence) => (occ.event.title ? String(occ.event.title) : locale.value.schedule.untitled);

function whenText(start: Date, end: Date, allDay: boolean) {
    const s = locale.value.schedule;
    if (allDay) {
        const last = addDays(end, -1);
        return isSameDay(start, last) || last < start
            ? formatMessage(s.allDayWhen, { date: format(start, s.dayTitle) })
            : formatMessage(s.allDayRangeWhen, { start: format(start, s.dayTitle), end: format(last, s.dayTitle) });
    }
    const endText = isSameDay(start, end) || (minutesOfDay(end) === 0 && dayDiff(start, end) === 1) ? fmtTime(end) : `${format(end, s.dayTitle)} ${fmtTime(end)}`;
    return formatMessage(s.timedWhen, { date: format(start, s.dayTitle), start: fmtTime(start), end: endText });
}

function labelOf(occ: Occurrence) {
    const s = locale.value.schedule;
    let when = whenText(occ.start, occ.end, occ.allDay);
    if (occ.recurring) when = `${when}, ${s.recurring}`;
    const resource = view.value === 'timeline' ? props.resources[resourceIndex(occ.resourceId)]?.title : undefined;
    return resource ? formatMessage(s.eventResourceLabel, { title: titleOf(occ), when, resource }) : formatMessage(s.eventLabel, { title: titleOf(occ), when });
}

const timeText = (occ: Occurrence) => (occ.allDay ? '' : `${fmtTime(occ.start)} – ${fmtTime(occ.end)}`);
const isEditable = (occ: Occurrence) => occ.event.editable ?? props.editable;
const isDragging = (occ: Occurrence) => drag.value?.key === occ.key;
const isBusiness = (start: Date, end: Date) => isBusinessTime(start, end, props.businessHours);

const info = (occ: Occurrence): ScheduleOccurrenceInfo => ({ event: occ.event, start: occ.start, end: occ.end, allDay: occ.allDay, resourceId: occ.resourceId, recurring: occ.recurring, key: occ.key });

function commit(occ: Occurrence, next: Override, kind: 'move' | 'resize', via: 'pointer' | 'keyboard') {
    if (next.start.getTime() === occ.start.getTime() && next.end.getTime() === occ.end.getTime() && next.resourceId === occ.resourceId && next.allDay === occ.allDay) return false;
    const key = occ.key;
    const previous = overrides.get(key);
    overrides.set(key, next);
    emit('event-change', {
        event: occ.event,
        occurrence: info(occ),
        kind,
        start: next.start,
        end: next.end,
        allDay: next.allDay,
        resourceId: next.resourceId,
        via,
        revert: () => {
            if (previous) overrides.set(key, previous);
            else overrides.delete(key);
        }
    });
    const text = whenText(next.start, next.end, next.allDay);
    announce(formatMessage(kind === 'move' ? locale.value.schedule.eventMoved : locale.value.schedule.eventResized, { title: titleOf(occ), when: text }));
    return true;
}

function onEventClick(event: Event, occ: Occurrence) {
    emit('event-click', { event: occ.event, occurrence: info(occ), originalEvent: event });
}

function focusEvent(key: string) {
    nextTick(() => {
        const el = rootRef.value?.querySelector<HTMLElement>(`[data-vt-event="${CSS.escape(key)}"]`);
        el?.focus();
    });
}

/** Alt+arrows move an event, Alt+Shift+arrows move its end. */
function onEventKeydown(event: KeyboardEvent, occ: Occurrence) {
    if (!event.altKey || !isEditable(occ)) return;
    const key = event.key;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;
    event.preventDefault();
    const rtl = rootRef.value ? getComputedStyle(rootRef.value).direction === 'rtl' : false;
    const horizontal = key === 'ArrowLeft' || key === 'ArrowRight';
    const sign = key === 'ArrowUp' || key === (rtl ? 'ArrowRight' : 'ArrowLeft') ? -1 : 1;
    const dayBased = occ.allDay || view.value === 'month';
    const resize = event.shiftKey;
    const nextState: Override = { start: occ.start, end: occ.end, allDay: occ.allDay, resourceId: occ.resourceId };
    if (view.value === 'timeline') {
        if (!horizontal && !resize) {
            const r = resourceIndex(occ.resourceId) + sign;
            if (r < 0 || r >= props.resources.length) return;
            nextState.resourceId = props.resources[r]!.id;
        } else if (!horizontal) return;
        else if (occ.allDay) {
            if (resize) nextState.end = maxDate(shiftDays(occ.end, sign), addDays(occ.start, 1));
            else Object.assign(nextState, { start: shiftDays(occ.start, sign), end: shiftDays(occ.end, sign) });
        } else if (resize) nextState.end = maxDate(addMinutes(occ.end, sign * snap.value), addMinutes(occ.start, snap.value));
        else Object.assign(nextState, { start: addMinutes(occ.start, sign * snap.value), end: addMinutes(occ.end, sign * snap.value) });
    } else if (dayBased) {
        const step = horizontal ? sign : sign * 7;
        if (resize) nextState.end = maxDate(shiftDays(occ.end, step), occ.allDay ? addDays(startOfDay(occ.start), 1) : addMinutes(occ.start, snap.value));
        else Object.assign(nextState, { start: shiftDays(occ.start, step), end: shiftDays(occ.end, step) });
    } else if (horizontal) {
        if (resize) return;
        Object.assign(nextState, { start: shiftDays(occ.start, sign), end: shiftDays(occ.end, sign) });
    } else if (resize) nextState.end = maxDate(addMinutes(occ.end, sign * snap.value), addMinutes(occ.start, snap.value));
    else Object.assign(nextState, { start: addMinutes(occ.start, sign * snap.value), end: addMinutes(occ.end, sign * snap.value) });
    if (commit(occ, nextState, resize ? 'resize' : 'move', 'keyboard')) {
        // Follow the event when it leaves the period on show.
        if (nextState.start >= range.value.end || nextState.end <= range.value.start) setDate(startOfDay(nextState.start));
        focusEvent(occ.key);
    }
}

const maxDate = (a: Date, b: Date) => (a > b ? a : b);

// ---- the grid's focus and selection ----------------------------------------------

const timed = computed(() => view.value === 'week' || view.value === 'day' || view.value === 'timeline');
const atFocusTime = (day: Date) => {
    const minutes = snapMinutes(Math.min(Math.max(parseTime(props.scrollTime, 480), minMinutes.value), maxMinutes.value - slotMinutes.value), slotMinutes.value);
    return addMinutes(startOfDay(day), minutes);
};
const focus = ref<{ date: Date; resource: number }>({ date: atFocusTime(current.value), resource: 0 });

/** A selection in progress: from the anchor cell to the head cell. */
const selecting = shallowRef<{ anchor: ScheduleCell; head: ScheduleCell; via: 'pointer' | 'keyboard' } | null>(null);
const selection = computed(() => {
    const s = selecting.value;
    if (!s) return null;
    const a = s.anchor;
    const b = s.head;
    const start = a.start < b.start ? a.start : b.start;
    const endA = addMinutes(a.start, a.span);
    const endB = addMinutes(b.start, b.span);
    const end = endA > endB ? endA : endB;
    return { start, end, allDay: a.allDay, resource: a.resource };
});

const cellSpan = computed(() => (view.value === 'timeline' ? timelineSlotMinutes.value : slotMinutes.value));
const focusCell = (): ScheduleCell => ({ start: focus.value.date, span: timed.value ? cellSpan.value : 1440, allDay: !timed.value, resource: focus.value.resource });

// Keep the tab stop inside what is on show.
watch(
    [range, view],
    () => {
        const f = focus.value.date;
        const { start, end } = range.value;
        const inside = f >= start && f < end;
        let day = inside ? f : isSameDay(current.value, start) || (current.value >= start && current.value < end) ? current.value : start;
        if (view.value === 'month' && !(day >= start && day < end)) day = start;
        const minutes = minutesOfDay(f);
        const target = timed.value
            ? minutes >= minMinutes.value && minutes < maxMinutes.value && inside
                ? f
                : atFocusTime(day)
            : startOfDay(day);
        focus.value = { date: target, resource: Math.min(focus.value.resource, Math.max(0, props.resources.length - 1)) };
    },
    { immediate: true }
);

const sameCell = (a: ScheduleCell, b: { start: Date; resource: number }) => a.start.getTime() === b.start.getTime() && (view.value !== 'timeline' || a.resource === b.resource);
const isFocused = (cell: ScheduleCell) => cell.allDay === !timed.value && sameCell(cell, { start: focus.value.date, resource: focus.value.resource });
function isSelected(cell: ScheduleCell) {
    const s = selection.value;
    if (!s || s.allDay !== cell.allDay || (view.value === 'timeline' && s.resource !== cell.resource)) return false;
    return cell.start >= s.start && addMinutes(cell.start, cell.span) <= s.end;
}

function cellLabel(cell: ScheduleCell) {
    const s = locale.value.schedule;
    const day = format(cell.start, s.dayTitle);
    const resource = view.value === 'timeline' ? props.resources[cell.resource]?.title : undefined;
    const text = cell.allDay ? day : `${day}, ${fmtTime(cell.start)}`;
    return resource ? `${resource}, ${text}` : text;
}

const rootRef = ref<HTMLElement | null>(null);

function focusGridCell() {
    nextTick(() => rootRef.value?.querySelector<HTMLElement>('[data-vt-slot][tabindex="0"]')?.focus({ preventScroll: false }));
}

function moveFocus(target: Date, resource = focus.value.resource) {
    const { start, end } = range.value;
    focus.value = { date: target, resource };
    const otherMonth = view.value === 'month' && (target.getMonth() !== current.value.getMonth() || target.getFullYear() !== current.value.getFullYear());
    if (target < start || target >= end || otherMonth) setDate(startOfDay(target));
    focusGridCell();
}

function onGridKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (!target.hasAttribute('data-vt-slot')) return;
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        const s = selection.value;
        if (s) {
            emit('select', { start: s.start, end: s.end, allDay: s.allDay, resourceId: props.resources[s.resource]?.id, via: 'keyboard' });
            announce(formatMessage(locale.value.schedule.selected, { when: whenText(s.start, s.end, s.allDay) }));
            selecting.value = null;
        } else {
            const cell = focusCell();
            emit('date-click', { date: cell.start, allDay: cell.allDay, resourceId: props.resources[cell.resource]?.id, originalEvent: event });
        }
        return;
    }
    if (key === 'Escape' && selecting.value) {
        event.preventDefault();
        selecting.value = null;
        return;
    }
    const rtl = rootRef.value ? getComputedStyle(rootRef.value).direction === 'rtl' : false;
    const from = focus.value.date;
    let to: Date | null = null;
    let resource = focus.value.resource;
    if (key === 'PageUp' || key === 'PageDown') {
        const step = key === 'PageUp' ? -1 : 1;
        to = view.value === 'month' ? calendarKeyTarget(from, key, { shiftKey: event.shiftKey }) : shiftDays(from, step * days.value.length);
    } else if (view.value === 'month') {
        to = calendarKeyTarget(from, rtl && (key === 'ArrowLeft' || key === 'ArrowRight') ? (key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft') : key, { firstDayOfWeek: firstDay.value });
    } else if (view.value === 'timeline' && (key === 'ArrowUp' || key === 'ArrowDown')) {
        resource = Math.max(0, Math.min(props.resources.length - 1, resource + (key === 'ArrowUp' ? -1 : 1)));
        to = from;
    } else {
        to = timeGridKeyTarget(from, key, cellSpan.value, { minMinutes: minMinutes.value, maxMinutes: maxMinutes.value }, { horizontal: view.value === 'timeline', rtl });
    }
    if (!to) return;
    event.preventDefault();
    const before = focusCell();
    if (event.shiftKey && props.selectable && key !== 'PageUp' && key !== 'PageDown') {
        if (!selecting.value) selecting.value = { anchor: before, head: before, via: 'keyboard' };
    } else selecting.value = null;
    moveFocus(to, resource);
    if (selecting.value) {
        selecting.value = { ...selecting.value, head: { ...focusCell(), resource: selecting.value.anchor.resource } };
        const s = selection.value!;
        announce(formatMessage(locale.value.schedule.selected, { when: whenText(s.start, s.end, s.allDay) }));
    }
}

// ---- pointer gestures ------------------------------------------------------------

function readCell(el: HTMLElement): ScheduleCell {
    return { start: new Date(Number(el.dataset.vtSlot)), span: Number(el.dataset.vtSpan), allDay: el.dataset.vtAllday === 'true', resource: Number(el.dataset.vtResource ?? 0) };
}

/** The cell under a point, and the time under it snapped to `snapDuration`. */
function hit(x: number, y: number): (ScheduleCell & { at: Date }) | null {
    // Events sit inside a cell of their row, so look under them for the cell itself.
    const stack = typeof document.elementsFromPoint === 'function' ? document.elementsFromPoint(x, y) : typeof document.elementFromPoint === 'function' ? [document.elementFromPoint(x, y)] : [];
    const found = stack.find((e) => e && !e.closest('[data-vt-layer]') && e.closest('[data-vt-slot]'));
    const el = found?.closest<HTMLElement>('[data-vt-slot]');
    if (!el || !rootRef.value?.contains(el)) return null;
    const cell = readCell(el);
    if (cell.allDay) return { ...cell, at: cell.start };
    const rect = el.getBoundingClientRect();
    const horizontal = view.value === 'timeline';
    const size = horizontal ? rect.width : rect.height;
    const fraction = size > 0 ? Math.min(1, Math.max(0, (horizontal ? x - rect.left : y - rect.top) / size)) : 0;
    const minutes = snapMinutes(minutesOfDay(cell.start) + fraction * cell.span, snap.value);
    return { ...cell, at: addMinutes(startOfDay(cell.start), minutes) };
}

const cellDrag = usePointerDrag<ScheduleCell>({
    threshold: 4,
    touchDelay: 300,
    onStart: (cell) => {
        if (!props.selectable) return false;
        selecting.value = { anchor: cell, head: cell, via: 'pointer' };
    },
    onMove: (_, p) => {
        const h = hit(p.x, p.y);
        if (!h || !selecting.value || h.allDay !== selecting.value.anchor.allDay) return;
        selecting.value = { ...selecting.value, head: { ...h, resource: selecting.value.anchor.resource } };
    },
    onEnd: () => {
        const s = selection.value;
        if (s) emit('select', { start: s.start, end: s.end, allDay: s.allDay, resourceId: props.resources[s.resource]?.id, via: 'pointer' });
    },
    onCancel: () => (selecting.value = null),
    onClick: (cell, event) => {
        selecting.value = null;
        focus.value = { date: cell.start, resource: cell.resource };
        emit('date-click', { date: cell.start, allDay: cell.allDay, resourceId: props.resources[cell.resource]?.id, originalEvent: event });
    }
});

function onCellPointerdown(event: PointerEvent) {
    const el = (event.target as HTMLElement).closest<HTMLElement>('[data-vt-slot]');
    if (!el || (event.target as HTMLElement).closest('[data-vt-event], button')) return;
    if (event.pointerType === 'mouse') selecting.value = null;
    cellDrag.press(event, readCell(el));
}

function cellAttrs(cell: ScheduleCell): Record<string, unknown> {
    return {
        'data-vt-slot': cell.start.getTime(),
        'data-vt-span': cell.span,
        'data-vt-allday': String(cell.allDay),
        'data-vt-resource': cell.resource,
        tabindex: isFocused(cell) ? 0 : -1,
        'aria-selected': isSelected(cell) ? 'true' : undefined,
        onPointerdown: onCellPointerdown,
        onFocus: () => {
            if (!isFocused(cell)) focus.value = { date: cell.start, resource: cell.resource };
        }
    };
}

const eventDrag = usePointerDrag<{ occ: Occurrence; kind: 'move' | 'resize'; anchor: ScheduleCell & { at: Date } }>({
    threshold: 4,
    touchDelay: 300,
    onStart: ({ occ, kind, anchor }) => {
        drag.value = { key: occ.key, kind, origin: occ, anchor, preview: { start: occ.start, end: occ.end, allDay: occ.allDay, resourceId: occ.resourceId } };
    },
    onMove: (_, p) => {
        const d = drag.value;
        const h = hit(p.x, p.y);
        if (!d || !h) return;
        const o = d.origin;
        const preview: Override = { start: o.start, end: o.end, allDay: o.allDay, resourceId: o.resourceId };
        const dayBased = h.allDay || d.anchor.allDay || o.allDay;
        if (d.kind === 'move') {
            if (dayBased) {
                const delta = dayDiff(d.anchor.at, h.at);
                preview.start = shiftDays(o.start, delta);
                preview.end = shiftDays(o.end, delta);
            } else {
                const delta = h.at.getTime() - d.anchor.at.getTime();
                preview.start = new Date(o.start.getTime() + delta);
                preview.end = new Date(o.end.getTime() + delta);
            }
            if (view.value === 'timeline') preview.resourceId = props.resources[h.resource]?.id ?? o.resourceId;
        } else if (o.allDay) {
            preview.end = maxDate(addDays(startOfDay(h.at), 1), addDays(startOfDay(o.start), 1));
        } else if (dayBased) {
            preview.end = maxDate(shiftDays(o.end, dayDiff(o.end, h.at)), addMinutes(o.start, snap.value));
        } else {
            preview.end = maxDate(h.at, addMinutes(o.start, snap.value));
        }
        drag.value = { ...d, preview };
    },
    onEnd: () => {
        const d = drag.value;
        drag.value = null;
        if (d) commit(d.origin, d.preview, d.kind, 'pointer');
    },
    onCancel: () => (drag.value = null)
});

function onEventPointerdown(event: PointerEvent, occ: Occurrence, kind: 'move' | 'resize') {
    if (!isEditable(occ)) return;
    const anchor = hit(event.clientX, event.clientY);
    if (!anchor) return;
    if (kind === 'resize') event.stopPropagation();
    eventDrag.press(event, { occ, kind, anchor });
}

// ---- "+N more" -------------------------------------------------------------------

const morePopover = ref<InstanceType<typeof Popover> | null>(null);
const moreDate = ref<Date | null>(null);
const moreEvents = computed(() => {
    const d = moreDate.value;
    if (!d) return [];
    const end = addDays(d, 1);
    return occurrences.value.filter((o) => o.start < end && o.end > d);
});
function showMore(event: Event, day: Date) {
    moreDate.value = day;
    morePopover.value?.show(event);
}

// ---- scrolling to the working day ------------------------------------------------

function registerScroller(el: HTMLElement | null) {
    if (!el) return;
    nextTick(() => {
        const total = maxMinutes.value - minMinutes.value;
        const at = Math.max(0, parseTime(props.scrollTime, 480) - minMinutes.value);
        if (view.value === 'timeline') el.scrollLeft = (at / total) * (el.scrollWidth / Math.max(1, props.timelineDays));
        else el.scrollTop = (at / total) * el.scrollHeight;
    });
}

const gridAttrs = computed(() => {
    const named = controlAttrs.value['aria-label'] || controlAttrs.value['aria-labelledby'];
    return mergeProps(controlAttrs.value, {
        role: 'grid',
        'aria-labelledby': named ? undefined : titleId,
        'aria-describedby': instructionsId,
        'aria-multiselectable': props.selectable ? 'true' : undefined,
        onKeydown: onGridKeydown
    });
});

const context: ScheduleContext = {
    part,
    locale,
    props,
    slots,
    id,
    view,
    views,
    range,
    days,
    occurrences,
    resources,
    today,
    now,
    firstDay,
    minMinutes,
    maxMinutes,
    slotMinutes,
    timelineSlotMinutes,
    focus,
    selection,
    gridAttrs,
    instructionsId,
    eventInstructionsId,
    colorOf,
    labelOf,
    titleOf,
    timeText,
    isEditable,
    isDragging,
    format,
    formatTime: fmtTime,
    isBusiness,
    isFocused,
    isSelected,
    cellLabel,
    cellAttrs,
    onGridKeydown,
    onEventPointerdown,
    onEventKeydown,
    onEventClick,
    gotoDay,
    showMore,
    registerScroller
};
provide(scheduleKey, context);

const viewLabel = (v: ScheduleViewName) => locale.value.schedule[v];

defineExpose({ prev, next, today: goToday, setView, focus: focusGridCell });
</script>

<template>
    <div ref="rootRef" v-bind="mergeProps(rootAttrs, part('root', { view, dragging: !!drag || cellDrag.active.value }))">
        <slot name="toolbar" :title="title" :view="view" :views="views" :date="current" :prev="prev" :next="next" :today="goToday" :set-view="setView">
            <div v-if="toolbar" v-bind="part('toolbar')">
                <div v-bind="part('nav')">
                    <Button icon="chevronLeft" variant="text" severity="secondary" :aria-label="locale.schedule.previous" :unstyled="unstyled" @click="prev" />
                    <Button icon="chevronRight" variant="text" severity="secondary" :aria-label="locale.schedule.next" :unstyled="unstyled" @click="next" />
                    <Button :label="locale.today" variant="outlined" severity="secondary" size="small" :unstyled="unstyled" @click="goToday" />
                </div>
                <div :id="titleId" aria-live="polite" v-bind="part('title')">{{ title }}</div>
                <div v-if="views.length > 1" role="group" :aria-label="locale.schedule.views" v-bind="part('views')">
                    <Button
                        v-for="v in views"
                        :key="v"
                        :label="viewLabel(v)"
                        size="small"
                        :variant="v === view ? 'filled' : 'text'"
                        :severity="v === view ? 'primary' : 'secondary'"
                        :aria-pressed="v === view ? 'true' : 'false'"
                        :unstyled="unstyled"
                        @click="setView(v)"
                    />
                </div>
            </div>
        </slot>
        <div v-if="!toolbar || $slots.toolbar" :id="titleId" :style="visuallyHidden">{{ title }}</div>

        <ScheduleMonth v-if="view === 'month'" />
        <ScheduleTimeGrid v-else-if="view === 'week' || view === 'day'" :key="view" />
        <ScheduleTimeline v-else-if="view === 'timeline'" />
        <ScheduleAgenda v-else />

        <span :id="instructionsId" hidden>{{ locale.schedule.gridInstructions }}</span>
        <span :id="eventInstructionsId" hidden>{{ locale.schedule.eventInstructions }}</span>
        <span role="status" aria-live="polite" aria-atomic="true" :style="visuallyHidden" v-bind="part('status')">{{ announcement }}</span>

        <Popover ref="morePopover" :aria-label="moreDate ? format(moreDate, locale.schedule.dayTitle) : undefined" :unstyled="unstyled" @hide="moreDate = null">
            <div v-if="moreDate" v-bind="part('more')">
                <div v-bind="part('moreTitle')">{{ format(moreDate, locale.schedule.dayTitle) }}</div>
                <ScheduleEventView v-for="occ in moreEvents" :key="occ.key" :occ="occ" variant="list" />
            </div>
        </Popover>
    </div>
</template>

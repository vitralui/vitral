import {
    addDays,
    addMinutes,
    calendarKeyTarget,
    dayDiff,
    en,
    formatDate,
    formatMessage,
    formatTime,
    fromZone,
    isClient,
    isValidTimeZone,
    isSameDay,
    loadStyle,
    minutesOfDay,
    parseTime,
    shiftDays,
    snapMinutes,
    startOfDay,
    stepViewDate,
    timeGridKeyTarget,
    toZone,
    type Locale
} from '@vitral/core';
import { createOverlay, createTooltips } from '@vitral/controls';
import { createRoot, partResolver, pointerDrag, type Props } from '@vitral/dom';
import { baseStyle, buttonStyle, scheduleStyle } from '@vitral/styles';
import {
    cellLabel,
    cellSelected,
    daysFor,
    daysOf,
    defaultModels,
    eventsOnDay,
    focusTimeOf,
    infoOf,
    isBusiness,
    isEditable,
    isTimed,
    labelOf,
    maxDate,
    occurrencesOf,
    rangeOf,
    resourceIndexOf,
    sameCell,
    selectionOf,
    settingsOf,
    titleOf,
    titleTextOf,
    viewsOf,
    whenText,
    type Override,
    type ScheduleSettings
} from './engine/state';
import type { Occurrence, ScheduleCell, ScheduleConfig, ScheduleModels, ScheduleViewName } from './engine/types';
import { moreView } from './render/more';
import { scheduleView, type ViewActions, type ViewContext } from './render/index';

/**
 * A calendar and scheduler with no framework in it: it is handed a
 * configuration, it draws the view into the element it is given, and it
 * reports what the reader did.
 *
 * Month, week, day and timeline are WAI-ARIA grids named by the period on
 * show: one cell holds the tab stop and the arrow keys move it (Page Up and
 * Page Down change the period), Shift with the arrows selects a range and
 * Enter picks it — the keyboard way to drag across empty time. Events are
 * buttons named by their title and full time; Alt with the arrows moves one
 * and Alt+Shift changes its end, and each change is announced. A pointer drags
 * events, their end edge, and empty time. Every change is shown at once and
 * reported with a `revert()`.
 */

export interface ScheduleHandle {
    /** Changes part of the configuration; what did not change is not redrawn. */
    update(config: Partial<ScheduleConfig>): void;
    /** The models as they stand: the view on show and the date it is centred on. */
    state(): ScheduleModels;
    /** Draws again, for events that changed underneath. */
    refresh(): void;
    prev(): void;
    next(): void;
    today(): void;
    setView(view: ScheduleViewName): void;
    /** Puts the keyboard on the grid cell that holds the tab stop. */
    focus(): void;
    /** Removes everything this schedule added to the element. */
    destroy(): void;
    readonly element: HTMLElement;
}

let counter = 0;

export function createSchedule(element: HTMLElement, config: ScheduleConfig = {}): ScheduleHandle {
    let current: ScheduleConfig = { ...config };
    let models: ScheduleModels = { ...defaultModels(), ...pickModels(config) };
    // The same validation the settings do, since these run before them.
    const startZone = config.timeZone && isValidTimeZone(config.timeZone) ? config.timeZone : undefined;
    let today = startOfDay(toZone(new Date(), startZone));
    let now = toZone(new Date(), startZone);
    let announcement = '';
    /** What the reader has moved since the events were handed over. */
    const overrides = new Map<string, Override>();
    let drag: { key: string; kind: 'move' | 'resize'; origin: Occurrence; anchor: ScheduleCell & { at: Date }; preview: Override } | null = null;
    let selecting: { anchor: ScheduleCell; head: ScheduleCell; via: 'pointer' | 'keyboard' } | null = null;
    let focus = { date: new Date(0), resource: 0 };
    let lastRange = '';
    let scroller: HTMLElement | null = null;
    let scrolled = '';
    let moreDay: Date | null = null;
    let moreAnchor: HTMLElement | null = null;
    /** The context the last draw produced, which the day's list draws from. */
    let drawn: ViewContext | null = null;

    const id = config.id ?? `vt-schedule-${++counter}`;
    const ids = { title: `${id}-title`, gridHelp: `${id}-help`, eventHelp: `${id}-event-help`, more: `${id}-more` };
    const root = createRoot(element);
    const locale = (): Locale => current.locale ?? en;
    const part = partResolver({
        style: scheduleStyle,
        unstyled: () => !!current.unstyled,
        classes: () => current.classes,
        pt: () => current.pt,
        props: () => current as Record<string, unknown>
    });

    // What a toolbar button does, shown the way every other Vitral control
    // shows it rather than in the browser's own `title`.
    const tooltips = createTooltips(() => ({
        placement: 'bottom',
        unstyled: current.unstyled,
        nonce: current.nonce,
        cssLayer: current.cssLayer,
        zIndex: current.zIndex,
        pt: current.pt
    }));
    // The toolbar's buttons wear the button's own classes, as they do when a
    // framework component draws them.
    const buttonPart = partResolver({ style: buttonStyle, unstyled: () => !!current.unstyled, props: () => current as Record<string, unknown> });

    const styleOptions = () => ({ nonce: current.nonce, cssLayer: current.cssLayer });
    if (!config.unstyled) {
        loadStyle(baseStyle.name, baseStyle.css, styleOptions());
        loadStyle(buttonStyle.name, buttonStyle.css, styleOptions());
        loadStyle(scheduleStyle.name, scheduleStyle.css, styleOptions());
    }

    // The clock moves the "now" line and rolls the day over at midnight.
    const clock = isClient
        ? setInterval(() => {
              now = shown(new Date());
              if (!isSameDay(now, today)) today = startOfDay(now);
              render();
          }, 30_000)
        : undefined;

    // ---- what is on show ------------------------------------------------------------

    const settings = (): ScheduleSettings => settingsOf(current, locale());
    /**
     * The grid is drawn in the reader's wall clock and the application speaks
     * in instants, so every date crossing that line is converted: `shown` on
     * the way in, `instant` on the way out. With no zone set they are both the
     * identity and nothing costs anything.
     */
    const zone = () => settings().timeZone;
    const shown = (date: Date) => toZone(date, zone());
    const instant = (date: Date) => fromZone(date, zone());
    const views = () => viewsOf(current);
    const range = () => rangeOf(current, models, settings());
    const occurrences = () => {
        const list = occurrencesOf(current, range(), settings(), overrides);
        if (!drag) return list;
        return list.map((occurrence) => (occurrence.key === drag!.key ? { ...occurrence, ...drag!.preview } : occurrence));
    };
    const resources = () => current.resources ?? [];
    const timed = () => isTimed(models.view);
    const cellSpan = () => (models.view === 'timeline' ? settings().timelineSlotMinutes : settings().slotMinutes);
    const focusCell = (): ScheduleCell => ({ start: focus.date, span: timed() ? cellSpan() : 1440, allDay: !timed(), resource: focus.resource });
    const selection = () => (selecting ? selectionOf(selecting.anchor, selecting.head) : null);

    function emit<K extends keyof NonNullable<ScheduleConfig['on']>>(name: K, payload: Parameters<NonNullable<NonNullable<ScheduleConfig['on']>[K]>>[0]) {
        const handler = current.on?.[name] as ((value: unknown) => void) | undefined;
        handler?.(payload);
    }

    function change(next: Partial<ScheduleModels>) {
        models = { ...models, ...next };
        current.on?.change?.({ ...models });
        render();
    }

    function announce(text: string) {
        // Cleared first, so the same words said twice are read twice.
        announcement = '';
        render();
        announcement = text;
        render();
    }

    // ---- moving about ---------------------------------------------------------------

    const step = (by: number) => change({ date: stepViewDate(models.view, models.date, by, { days: daysFor(models.view, settings()) }) });

    function goToday() {
        today = startOfDay(shown(new Date()));
        focus = { ...focus, date: timed() ? focusTimeOf(today, settings()) : today };
        change({ date: today });
    }

    function setView(view: ScheduleViewName) {
        if (view === models.view) return;
        change({ view });
    }

    function gotoDay(day: Date) {
        const next: Partial<ScheduleModels> = { date: startOfDay(day) };
        if (views().includes('day')) next.view = 'day';
        change(next);
    }

    /** Keeps the tab stop inside what is on show, whenever the period or the view changes. */
    function settleFocus() {
        const { start, end } = range();
        const inside = focus.date >= start && focus.date < end;
        const set = settings();
        let day = inside ? focus.date : models.date >= start && models.date < end ? models.date : start;
        if (models.view === 'month' && !(day >= start && day < end)) day = start;
        const minutes = minutesOfDay(focus.date);
        const target = timed() ? (minutes >= set.minMinutes && minutes < set.maxMinutes && inside ? focus.date : focusTimeOf(day, set)) : startOfDay(day);
        focus = { date: target, resource: Math.min(focus.resource, Math.max(0, resources().length - 1)) };
    }

    // ---- events the reader moves ------------------------------------------------------

    function commit(occurrence: Occurrence, next: Override, kind: 'move' | 'resize', via: 'pointer' | 'keyboard'): boolean {
        if (
            next.start.getTime() === occurrence.start.getTime() &&
            next.end.getTime() === occurrence.end.getTime() &&
            next.resourceId === occurrence.resourceId &&
            next.allDay === occurrence.allDay
        )
            return false;
        const key = occurrence.key;
        const previous = overrides.get(key);
        // What the reader dragged is in their wall clock. An override stands in
        // for the event itself, and occurrences are drawn by shifting events
        // into the wall clock, so storing it unconverted would shift it twice.
        const moved: Override = next.allDay ? next : { ...next, start: instant(next.start), end: instant(next.end) };
        overrides.set(key, moved);
        emit('event-change', {
            event: occurrence.event,
            occurrence: infoOf(occurrence, zone()),
            kind,
            start: moved.start,
            end: moved.end,
            allDay: next.allDay,
            resourceId: next.resourceId,
            via,
            revert: () => {
                if (previous) overrides.set(key, previous);
                else overrides.delete(key);
                render();
            }
        });
        const words = locale().schedule;
        announce(
            formatMessage(kind === 'move' ? words.eventMoved : words.eventResized, {
                title: titleTextOf(occurrence, locale()),
                when: whenText(next.start, next.end, next.allDay, locale(), current.hour12)
            })
        );
        return true;
    }

    // Drawing is synchronous, so what was moved is already where it belongs.
    const focusEvent = (key: string) => element.querySelector<HTMLElement>(`[data-vt-event="${cssEscape(key)}"]`)?.focus();

    /** Alt and an arrow move an event; Alt+Shift move its end. */
    function eventKeydown(event: KeyboardEvent, occurrence: Occurrence) {
        const set = settings();
        if (!event.altKey || !isEditable(occurrence, set)) return;
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const rtl = isRtl();
        const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
        const sign = event.key === 'ArrowUp' || event.key === (rtl ? 'ArrowRight' : 'ArrowLeft') ? -1 : 1;
        const dayBased = occurrence.allDay || models.view === 'month';
        const resize = event.shiftKey;
        const next: Override = { start: occurrence.start, end: occurrence.end, allDay: occurrence.allDay, resourceId: occurrence.resourceId };
        const list = resources();
        if (models.view === 'timeline') {
            if (!horizontal && !resize) {
                const index = resourceIndexOf(list, occurrence.resourceId) + sign;
                if (index < 0 || index >= list.length) return;
                next.resourceId = list[index]!.id;
            } else if (!horizontal) return;
            else if (occurrence.allDay) {
                if (resize) next.end = maxDate(shiftDays(occurrence.end, sign), addDays(occurrence.start, 1));
                else Object.assign(next, { start: shiftDays(occurrence.start, sign), end: shiftDays(occurrence.end, sign) });
            } else if (resize) next.end = maxDate(addMinutes(occurrence.end, sign * set.snap), addMinutes(occurrence.start, set.snap));
            else Object.assign(next, { start: addMinutes(occurrence.start, sign * set.snap), end: addMinutes(occurrence.end, sign * set.snap) });
        } else if (dayBased) {
            const by = horizontal ? sign : sign * 7;
            if (resize) next.end = maxDate(shiftDays(occurrence.end, by), occurrence.allDay ? addDays(startOfDay(occurrence.start), 1) : addMinutes(occurrence.start, set.snap));
            else Object.assign(next, { start: shiftDays(occurrence.start, by), end: shiftDays(occurrence.end, by) });
        } else if (horizontal) {
            if (resize) return;
            Object.assign(next, { start: shiftDays(occurrence.start, sign), end: shiftDays(occurrence.end, sign) });
        } else if (resize) next.end = maxDate(addMinutes(occurrence.end, sign * set.snap), addMinutes(occurrence.start, set.snap));
        else Object.assign(next, { start: addMinutes(occurrence.start, sign * set.snap), end: addMinutes(occurrence.end, sign * set.snap) });

        if (commit(occurrence, next, resize ? 'resize' : 'move', 'keyboard')) {
            // Follow the event when it leaves the period on show.
            const { start, end } = range();
            if (next.start >= end || next.end <= start) change({ date: startOfDay(next.start) });
            else render();
            focusEvent(occurrence.key);
        }
    }

    // ---- the grid's keyboard ----------------------------------------------------------

    const isRtl = () => (isClient ? getComputedStyle(element).direction === 'rtl' : false);

    const focusGridCell = () => element.querySelector<HTMLElement>('[data-vt-slot][tabindex="0"]')?.focus({ preventScroll: false });

    function moveFocus(target: Date, resource = focus.resource) {
        const { start, end } = range();
        focus = { date: target, resource };
        const otherMonth = models.view === 'month' && (target.getMonth() !== models.date.getMonth() || target.getFullYear() !== models.date.getFullYear());
        if (target < start || target >= end || otherMonth) change({ date: startOfDay(target) });
        else render();
        focusGridCell();
    }

    function gridKeydown(event: KeyboardEvent) {
        const target = event.target as HTMLElement;
        if (!target.hasAttribute('data-vt-slot')) return;
        const set = settings();
        const list = resources();
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const chosen = selection();
            if (chosen) {
                emit('select', { start: chosen.allDay ? chosen.start : instant(chosen.start), end: chosen.allDay ? chosen.end : instant(chosen.end), allDay: chosen.allDay, resourceId: list[chosen.resource]?.id, via: 'keyboard' });
                selecting = null;
                announce(formatMessage(locale().schedule.selected, { when: whenText(chosen.start, chosen.end, chosen.allDay, locale(), current.hour12) }));
            } else {
                const cell = focusCell();
                emit('date-click', { date: cell.allDay ? cell.start : instant(cell.start), allDay: cell.allDay, resourceId: list[cell.resource]?.id, originalEvent: event });
            }
            return;
        }
        if (event.key === 'Escape' && selecting) {
            event.preventDefault();
            selecting = null;
            render();
            return;
        }
        const rtl = isRtl();
        const from = focus.date;
        let to: Date | null = null;
        let resource = focus.resource;
        if (event.key === 'PageUp' || event.key === 'PageDown') {
            const by = event.key === 'PageUp' ? -1 : 1;
            to = models.view === 'month' ? calendarKeyTarget(from, event.key, { shiftKey: event.shiftKey }) : shiftDays(from, by * daysOf(range()).length);
        } else if (models.view === 'month') {
            const key = rtl && (event.key === 'ArrowLeft' || event.key === 'ArrowRight') ? (event.key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft') : event.key;
            to = calendarKeyTarget(from, key, { firstDayOfWeek: set.firstDay });
        } else if (models.view === 'timeline' && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
            resource = Math.max(0, Math.min(list.length - 1, resource + (event.key === 'ArrowUp' ? -1 : 1)));
            to = from;
        } else {
            to = timeGridKeyTarget(from, event.key, cellSpan(), { minMinutes: set.minMinutes, maxMinutes: set.maxMinutes }, { horizontal: models.view === 'timeline', rtl });
        }
        if (!to) return;
        event.preventDefault();
        const before = focusCell();
        if (event.shiftKey && set.selectable && event.key !== 'PageUp' && event.key !== 'PageDown') {
            if (!selecting) selecting = { anchor: before, head: before, via: 'keyboard' };
        } else selecting = null;
        moveFocus(to, resource);
        if (selecting) {
            selecting = { ...selecting, head: { ...focusCell(), resource: selecting.anchor.resource } };
            const chosen = selection()!;
            announce(formatMessage(locale().schedule.selected, { when: whenText(chosen.start, chosen.end, chosen.allDay, locale(), current.hour12) }));
        }
    }

    // ---- the pointer ------------------------------------------------------------------

    const readCell = (el: HTMLElement): ScheduleCell => ({
        start: new Date(Number(el.dataset.vtSlot)),
        span: Number(el.dataset.vtSpan),
        allDay: el.dataset.vtAllday === 'true',
        resource: Number(el.dataset.vtResource ?? 0)
    });

    /** The cell under a point, and the time under it snapped to `snapDuration`. */
    function hit(x: number, y: number): (ScheduleCell & { at: Date }) | null {
        // Events sit inside a cell of their row, so look under them for the cell itself.
        const stack = typeof document.elementsFromPoint === 'function' ? document.elementsFromPoint(x, y) : [document.elementFromPoint?.(x, y)];
        const found = stack.find((el) => el && !el.closest('[data-vt-layer]') && el.closest('[data-vt-slot]'));
        const el = found?.closest<HTMLElement>('[data-vt-slot]');
        if (!el || !element.contains(el)) return null;
        const cell = readCell(el);
        if (cell.allDay) return { ...cell, at: cell.start };
        const rect = el.getBoundingClientRect();
        const horizontal = models.view === 'timeline';
        const size = horizontal ? rect.width : rect.height;
        const fraction = size > 0 ? Math.min(1, Math.max(0, (horizontal ? x - rect.left : y - rect.top) / size)) : 0;
        const minutes = snapMinutes(minutesOfDay(cell.start) + fraction * cell.span, settings().snap);
        return { ...cell, at: addMinutes(startOfDay(cell.start), minutes) };
    }

    const cellDrag = pointerDrag<ScheduleCell>({
        threshold: 4,
        touchDelay: 300,
        onStart: (cell) => {
            if (!settings().selectable) return false;
            selecting = { anchor: cell, head: cell, via: 'pointer' };
            render();
        },
        onMove: (_, info) => {
            const at = hit(info.x, info.y);
            if (!at || !selecting || at.allDay !== selecting.anchor.allDay) return;
            selecting = { ...selecting, head: { ...at, resource: selecting.anchor.resource } };
            render();
        },
        onEnd: () => {
            const chosen = selection();
            if (chosen) emit('select', { start: chosen.allDay ? chosen.start : instant(chosen.start), end: chosen.allDay ? chosen.end : instant(chosen.end), allDay: chosen.allDay, resourceId: resources()[chosen.resource]?.id, via: 'pointer' });
        },
        onCancel: () => {
            selecting = null;
            render();
        },
        onClick: (cell, event) => {
            selecting = null;
            focus = { date: cell.start, resource: cell.resource };
            render();
            emit('date-click', { date: cell.allDay ? cell.start : instant(cell.start), allDay: cell.allDay, resourceId: resources()[cell.resource]?.id, originalEvent: event });
        }
    });

    const eventDrag = pointerDrag<{ occurrence: Occurrence; kind: 'move' | 'resize'; anchor: ScheduleCell & { at: Date } }>({
        threshold: 4,
        touchDelay: 300,
        onStart: ({ occurrence, kind, anchor }) => {
            drag = { key: occurrence.key, kind, origin: occurrence, anchor, preview: { start: occurrence.start, end: occurrence.end, allDay: occurrence.allDay, resourceId: occurrence.resourceId } };
            render();
        },
        onMove: (_, info) => {
            const at = hit(info.x, info.y);
            if (!drag || !at) return;
            const origin = drag.origin;
            const set = settings();
            const preview: Override = { start: origin.start, end: origin.end, allDay: origin.allDay, resourceId: origin.resourceId };
            const dayBased = at.allDay || drag.anchor.allDay || origin.allDay;
            if (drag.kind === 'move') {
                if (dayBased) {
                    const by = dayDiff(drag.anchor.at, at.at);
                    preview.start = shiftDays(origin.start, by);
                    preview.end = shiftDays(origin.end, by);
                } else {
                    const by = at.at.getTime() - drag.anchor.at.getTime();
                    preview.start = new Date(origin.start.getTime() + by);
                    preview.end = new Date(origin.end.getTime() + by);
                }
                if (models.view === 'timeline') preview.resourceId = resources()[at.resource]?.id ?? origin.resourceId;
            } else if (origin.allDay) preview.end = maxDate(addDays(startOfDay(at.at), 1), addDays(startOfDay(origin.start), 1));
            else if (dayBased) preview.end = maxDate(shiftDays(origin.end, dayDiff(origin.end, at.at)), addMinutes(origin.start, set.snap));
            else preview.end = maxDate(at.at, addMinutes(origin.start, set.snap));
            drag = { ...drag, preview };
            render();
        },
        onEnd: () => {
            const finished = drag;
            drag = null;
            if (finished) commit(finished.origin, finished.preview, finished.kind, 'pointer');
            render();
        },
        onCancel: () => {
            drag = null;
            render();
        }
    });

    function cellPointerdown(event: PointerEvent) {
        const el = (event.target as HTMLElement).closest<HTMLElement>('[data-vt-slot]');
        if (!el || (event.target as HTMLElement).closest('[data-vt-event], button')) return;
        if (event.pointerType === 'mouse') selecting = null;
        cellDrag.press(event, readCell(el));
    }

    function eventPointerdown(event: PointerEvent, occurrence: Occurrence, kind: 'move' | 'resize') {
        if (!isEditable(occurrence, settings())) return;
        const anchor = hit(event.clientX, event.clientY);
        if (!anchor) return;
        if (kind === 'resize') event.stopPropagation();
        eventDrag.press(event, { occurrence, kind, anchor });
    }

    // ---- "+N more" ---------------------------------------------------------------------

    function showMore(event: Event, day: Date) {
        moreDay = day;
        moreAnchor = (event.currentTarget ?? event.target) as HTMLElement;
        render();
        more.open();
    }

    /** The day's full list, in an overlay hanging from the button that asked for it. */
    const more = createOverlay({
        anchor: () => moreAnchor,
        render: () => (moreDay && drawn ? moreView(drawn, moreDay) : null),
        placement: 'bottom-start',
        target: () => current.overlayTarget,
        zIndex: current.zIndex,
        onClose: () => {
            moreDay = null;
            moreAnchor = null;
            render();
        }
    });

    // ---- scrolling to the working day ----------------------------------------------------

    function scrollToWork() {
        const set = settings();
        const key = `${models.view}:${range().start.getTime()}`;
        if (!scroller || scrolled === key) return;
        scrolled = key;
        const el = scroller;
        requestAnimationFrame(() => {
            const total = set.maxMinutes - set.minMinutes;
            const at = Math.max(0, set.scrollMinutes - set.minMinutes);
            if (models.view === 'timeline') el.scrollLeft = (at / total) * (el.scrollWidth / Math.max(1, set.timelineDays));
            else el.scrollTop = (at / total) * el.scrollHeight;
        });
    }

    // ---- drawing --------------------------------------------------------------------------

    const actions: ViewActions = {
        prev: () => step(-1),
        next: () => step(1),
        today: goToday,
        setView,
        gotoDay,
        gridKeydown,
        eventClick: (event, occurrence) => emit('event-click', { event: occurrence.event, occurrence: infoOf(occurrence, zone()), originalEvent: event }),
        eventKeydown,
        eventPointerdown,
        showMore,
        scroller: (el) => {
            scroller = (el as HTMLElement | null) ?? null;
            if (scroller) scrollToWork();
        }
    };

    function gridAttrs(): Props {
        const named = current.ariaLabel || current.ariaLabelledby;
        return {
            role: 'grid',
            'aria-label': current.ariaLabel,
            'aria-labelledby': current.ariaLabelledby ?? (named ? undefined : ids.title),
            'aria-describedby': ids.gridHelp,
            'aria-multiselectable': settings().selectable ? 'true' : undefined,
            onKeydown: gridKeydown
        };
    }

    function context(): ViewContext {
        const set = settings();
        const showing = range();
        const list = resources();
        const chosen = selection();
        return {
            config: current,
            models,
            settings: set,
            locale: locale(),
            range: showing,
            days: daysOf(showing),
            occurrences: occurrences(),
            resources: list,
            views: views(),
            title: titleOf(models.view, models.date, showing, locale()),
            today,
            now,
            focus,
            selection: chosen,
            dragging: drag?.key ?? null,
            announcement,
            ids,
            part,
            buttonPart,
            tip: (element, text) => tooltips.attach(element, text),
            gridAttrs,
            format: (date, pattern) => formatDate(date, pattern, locale()),
            formatTime: (date) => formatTime(date, locale().code, current.hour12),
            labelOf: (occurrence) => labelOf(occurrence, models.view, list, locale(), current.hour12),
            cellLabel: (cell) => cellLabel(cell, models.view, list, locale(), current.hour12),
            isFocused: (cell) => cell.allDay === !timed() && sameCell(cell, { start: focus.date, resource: focus.resource }, models.view),
            isSelected: (cell) => cellSelected(cell, chosen, models.view),
            isBusiness: (start, end) => isBusiness(start, end, current),
            cellAttrs,
            on: actions
        };
    }

    function cellAttrs(cell: ScheduleCell): Props {
        const focused = cell.allDay === !timed() && sameCell(cell, { start: focus.date, resource: focus.resource }, models.view);
        return {
            'data-vt-slot': String(cell.start.getTime()),
            'data-vt-span': String(cell.span),
            'data-vt-allday': String(cell.allDay),
            'data-vt-resource': String(cell.resource),
            tabindex: focused ? '0' : '-1',
            'aria-selected': cellSelected(cell, selection(), models.view) ? 'true' : undefined,
            onPointerdown: cellPointerdown,
            onFocus: () => {
                if (focused) return;
                focus = { date: cell.start, resource: cell.resource };
                render();
            }
        };
    }

    let drawing = false;
    function render() {
        // A change made while drawing (a focus moving, a clock ticking) is
        // drawn by the pass that is already running.
        if (drawing) return;
        drawing = true;
        try {
            settleFocus();
            drawn = context();
            root.attrs(part('root', { view: models.view, dragging: !!drag || cellDrag.active() }));
            root.render(scheduleView(drawn));
            more.update();
            scrollToWork();
            const key = `${drawn.range.start.getTime()}:${drawn.range.end.getTime()}:${models.view}`;
            if (key !== lastRange) {
                lastRange = key;
                emit('range-change', { start: instant(drawn.range.start), end: instant(drawn.range.end), view: models.view });
            }
        } finally {
            drawing = false;
        }
    }

    settleFocus();
    render();

    return {
        element,
        update(next) {
            const events = 'events' in next;
            current = { ...current, ...next };
            const changed = pickModels(next);
            if (Object.keys(changed).length) models = { ...models, ...changed };
            // New events are new facts: what the reader had moved no longer applies.
            if (events) overrides.clear();
            render();
        },
        state: () => ({ ...models }),
        refresh: render,
        prev: () => step(-1),
        next: () => step(1),
        today: goToday,
        setView,
        focus: focusGridCell,
        destroy() {
            clearInterval(clock);
            cellDrag.cancel();
            eventDrag.cancel();
            more.destroy();
            tooltips.destroy();
            root.clear();
        }
    };
}

function pickModels(config: Partial<ScheduleConfig>): Partial<ScheduleModels> {
    const out: Partial<ScheduleModels> = {};
    if (config.view) out.view = config.view;
    if (config.date instanceof Date && !Number.isNaN(config.date.getTime())) out.date = config.date;
    return out;
}

const cssEscape = (value: string): string => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value.replace(/["\\]/g, '\\$&'));

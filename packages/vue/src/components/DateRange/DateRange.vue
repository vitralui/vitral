<script setup lang="ts">
import {
    addMonths,
    calendarKeyTarget,
    formatDate,
    isDateSelectable,
    isInRange,
    isRangeEnd,
    isSameDay,
    isSameMonth,
    monthGrid,
    nearestSelectableDate,
    normalizeDateRange,
    pressRange,
    previewRange,
    rangeLength,
    startOfDay,
    weekdayOrder,
    type CalendarDay,
    type DateConstraints,
    type DateRange
} from '@vitral/core';
import { daterangeStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useId, watch } from 'vue';
import { useCalendarLevels } from '../../base/useCalendarLevels';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { useFocusTrap } from '../../composables/useFocusTrap';
import { useOverlay } from '../../composables/useOverlay';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import Button from '../Button/Button.vue';
import { Tooltip as vTooltip } from '../../directives/tooltip';
import Icon from '../Icon/Icon.vue';
import type { DateRangeEmits, DateRangeProps, DateRangeSlots } from './types';

/**
 * Two dates and the days between them. It is the date picker dialog's pattern
 * with one span instead of one day: a text box, a button that opens a modal
 * calendar, one tabbable day across all the months (roving tabindex), and focus
 * that lives in the dialog while it is open.
 *
 * Two months side by side is the default, because a span that crosses a month
 * boundary is the ordinary case and paging back and forth to pick it is not.
 * `months="1"` shows the same range in one calendar.
 *
 * The first press opens the range and the second closes it, either way round —
 * the ends sort themselves, so dragging backwards needs no thought. While one
 * end is down, the day under the pointer or the keyboard is drawn as the other,
 * so the span is visible before it is committed.
 *
 * The month and the year in each calendar's title are buttons, as the date
 * picker's are: they swap the calendars for a grid of months or of years, and
 * the month chosen there is put where the title that was pressed is. The range
 * is not touched on the way. `monthPicker` and `yearPicker` turn either off.
 */

defineOptions({ name: 'VtDateRange', inheritAttrs: false });

const props = withDefaults(defineProps<DateRangeProps>(), {
    unstyled: undefined,
    variant: undefined,
    months: 2,
    // Absent, not false: an unset boolean prop is `false` to Vue, and this one
    // has to tell "left to the number of months" from "asked for off".
    showOtherMonths: undefined,
    separator: '–',
    minDate: null,
    maxDate: null,
    monthPicker: true,
    yearPicker: true,
    placement: 'bottom-start',
    appendTo: 'body'
});
const overlayTarget = useOverlayTarget(() => props.appendTo);
const model = defineModel<DateRange>({ default: () => ({ start: null, end: null }) });
const emit = defineEmits<DateRangeEmits>();
defineSlots<DateRangeSlots>();

const { part, config, locale } = useComponent(daterangeStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();

const id = useId();
const dialogId = `${id}-dialog`;

const monthsRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLButtonElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);

const open = ref(false);
const hovered = ref<Date | null>(null);
const focusedDate = ref<Date | null>(null);

const value = computed(() => normalizeDateRange(model.value ?? { start: null, end: null }));
const interactive = computed(() => !props.disabled && !props.readonly);
const count = computed(() => Math.max(1, Math.min(3, Math.round(props.months))));
const pattern = computed(() => props.dateFormat ?? locale.value.dateFormat);
const firstDay = computed(() => props.firstDayOfWeek ?? locale.value.firstDayOfWeek);
const constraints = computed<DateConstraints>(() => ({
    min: props.minDate ?? undefined,
    max: props.maxDate ?? undefined,
    disabledDates: props.disabledDates,
    disabledDays: props.disabledDays
}));
const selectable = (date: Date) => isDateSelectable(date, constraints.value);

/** The leftmost month on show. Every other one follows from it. */
const view = ref(startOfDay(value.value.start ?? new Date()));
watch(
    () => value.value.start,
    (start) => {
        if (start && !open.value) view.value = startOfDay(start);
    }
);

const months = computed(() =>
    Array.from({ length: count.value }, (_, i) => {
        const at = addMonths(view.value, i);
        return {
            key: `${at.getFullYear()}-${at.getMonth()}`,
            date: at,
            year: at.getFullYear(),
            month: at.getMonth(),
            monthName: formatDate(at, 'MMMM', locale.value),
            title: formatDate(at, 'MMMM yyyy', locale.value),
            weeks: monthGrid(at.getFullYear(), at.getMonth(), firstDay.value)
        };
    })
);

const weekdays = computed(() =>
    weekdayOrder(firstDay.value).map((day) => ({ day, short: locale.value.dayNamesMin[day]!, long: locale.value.dayNames[day]! }))
);

/**
 * What the range looks like right now, which is the chosen one unless a start
 * is down and something is being pointed at or moved towards.
 */
const shown = computed(() => previewRange(value.value, interactive.value ? (hovered.value ?? focusedDate.value) : null));
const previewing = computed(() => !value.value.end && !!shown.value.end);
const nights = computed(() => Math.max(0, rangeLength(value.value) - 1));

const text = computed(() => {
    const { start, end } = value.value;
    if (!start) return '';
    const from = formatDate(start, pattern.value, locale.value);
    return end ? `${from} ${props.separator} ${formatDate(end, pattern.value, locale.value)}` : from;
});

/** The one day that takes the tab stop, across every month on show. */
const activeDate = computed(() => focusedDate.value ?? value.value.start ?? startOfDay(new Date()));

/** Days either side of a month: drawn on a single calendar, left out of several. */
const showOther = computed(() => props.showOtherMonths ?? count.value === 1);
/** A cell that is only there to hold the grid's shape. */
const blank = (day: CalendarDay) => !showOther.value && day.otherMonth;

/**
 * The day the tab stop sits on. The active one, normally — but a day the
 * calendars are only showing as a neighbour now has no cell of its own, so the
 * tab stop falls back to the first of the months on show and the grid stays
 * reachable. It also settles which of two calendars gets the tab stop when a
 * date is drawn in both, which nothing decided before.
 */
const tabDate = computed(() => {
    const active = activeDate.value;
    for (const month of months.value) for (const day of month.weeks.flat()) if (isSameDay(day.date, active) && !blank(day)) return active;
    return months.value[0]?.date ?? active;
});

function dayState(day: CalendarDay) {
    const end = isRangeEnd(day.date, shown.value);
    return {
        end,
        inRange: isInRange(day.date, shown.value) && !end,
        preview: previewing.value,
        today: day.today,
        otherMonth: day.otherMonth,
        disabled: !selectable(day.date)
    };
}

function press(day: CalendarDay, event?: Event) {
    if (!interactive.value || !selectable(day.date)) return;
    focusedDate.value = day.date;
    const next = pressRange(value.value, day.date);
    model.value = next;
    hovered.value = null;
    if (next.start && next.end) {
        emit('rangeSelect', next);
        if (!props.inline) hide();
    }
    if (props.inline || !next.end) focusActiveDay();
    void event;
}

function clear() {
    model.value = { start: null, end: null };
    emit('clear');
}

function setView(date: Date) {
    const at = startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
    if (isSameMonth(at, view.value)) return;
    view.value = at;
    emit('monthChange', { month: at.getMonth(), year: at.getFullYear() });
}

function page(step: number) {
    setView(addMonths(view.value, step));
}

/** The tab stop of whatever is on show: a day, or a cell of the month or the year grid. */
async function focusActiveDay() {
    await nextTick();
    panelRef.value?.querySelector<HTMLElement>('[role="grid"] [tabindex="0"]')?.focus();
}

// ---- the month and year grids ---------------------------------------------

/** Which calendar's title was pressed: the month chosen in the grid goes there. */
const pickedAt = ref(0);
/** The grid stands in for the calendars, so it is given their size and the panel does not move. */
const pickerSize = ref<{ width: string; height: string } | undefined>();

const inMonth = (date: Date | null, year: number, month?: number) => !!date && date.getFullYear() === year && (month === undefined || date.getMonth() === month);

const levels = useCalendarLevels({
    locale,
    constraints: () => constraints.value,
    today: () => startOfDay(new Date()),
    monthPicker: () => props.monthPicker,
    yearPicker: () => props.yearPicker,
    disabled: () => !!props.disabled,
    // A month or a year is marked when either end of the range is in it.
    selected: (year, month) => inMonth(value.value.start, year, month) || inMonth(value.value.end, year, month),
    onMonth(year, month) {
        const first = new Date(year, month, 1);
        const near = nearestSelectableDate(first, 1, constraints.value);
        focusedDate.value = near && isSameMonth(near, first) ? near : first;
        setView(addMonths(first, -pickedAt.value));
    },
    focus: focusActiveDay
});
const { level, rows: pickerRows, title: pickerTitle, pageLabels } = levels;

function openLevel(next: 'month' | 'year', index: number) {
    const rect = monthsRef.value?.getBoundingClientRect();
    pickerSize.value = rect && rect.width > 0 ? { width: `${rect.width}px`, height: `${rect.height}px` } : undefined;
    pickedAt.value = index;
    const at = months.value[index]!;
    levels.open(next, { year: at.year, month: at.month });
}

function onGridKeydown(event: KeyboardEvent) {
    if (props.disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const day = months.value.flatMap((m) => m.weeks.flat()).find((d) => isSameDay(d.date, activeDate.value));
        if (day) press(day, event);
        return;
    }
    const target = calendarKeyTarget(activeDate.value, event.key, { shiftKey: event.shiftKey, firstDayOfWeek: firstDay.value, constraints: constraints.value });
    if (!target) return;
    event.preventDefault();
    focusedDate.value = target;
    // Keep the moving day on screen: it leads the months rather than the months
    // trapping it.
    const last = addMonths(view.value, count.value - 1);
    if (target < view.value) setView(target);
    else if (target > new Date(last.getFullYear(), last.getMonth() + 1, 0)) setView(addMonths(target, -(count.value - 1)));
    focusActiveDay();
}

// ---- the popup ------------------------------------------------------------

useOverlay({
    anchor: buttonRef,
    overlay: computed(() => (props.inline ? null : panelRef.value)),
    placement: () => props.placement,
    onEscape: () => hide(true),
    onPointerDownOutside: () => hide()
});
useFocusTrap(computed(() => (props.inline ? null : panelRef.value)));

function show() {
    if (!interactive.value || open.value) return;
    if (value.value.start) view.value = startOfDay(new Date(value.value.start.getFullYear(), value.value.start.getMonth(), 1));
    levels.reset();
    open.value = true;
    focusedDate.value = value.value.start ?? null;
    emit('show');
    focusActiveDay();
}

function hide(returnFocus = false) {
    if (!open.value) return;
    open.value = false;
    hovered.value = null;
    emit('hide');
    if (returnFocus) buttonRef.value?.focus();
}

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    readonly: props.readonly,
    fluid: props.fluid,
    focused: open.value
}));

const panelAttrs = computed(() => {
    // Inline, the calendars are the component: they take the attributes, and with them the name they are given.
    if (props.inline) return mergeProps(rootAttrs.value, controlAttrs.value, { role: 'group' }, part('panel', { inline: true, disabled: props.disabled }));
    return mergeProps({ id: dialogId, role: 'dialog', 'aria-modal': 'true', 'aria-label': locale.value.aria.chooseDate }, part('panel', { disabled: props.disabled }));
});

defineExpose({ show, hide, clear });
</script>

<template>
    <div v-if="!inline" v-bind="mergeProps(rootAttrs, part('root', state))">
        <input
            v-bind="mergeProps(controlAttrs, part('input'))"
            :value="text"
            :placeholder="placeholder"
            :disabled="disabled"
            readonly
            :aria-invalid="invalid ? 'true' : undefined"
            @click="show"
        />
        <button
            ref="buttonRef"
            type="button"
            :aria-label="locale.aria.chooseDate"
            :aria-expanded="open"
            :aria-controls="open ? dialogId : undefined"
            aria-haspopup="dialog"
            :disabled="disabled"
            v-bind="part('dropdown')"
            @click="open ? hide(true) : show()"
        >
            <Icon icon="calendar" />
        </button>
    </div>

    <!-- One calendar for both: in place when inline, in the popup otherwise. -->
    <Teleport :to="overlayTarget" :disabled="inline">
        <div v-if="inline || open" ref="panelRef" v-bind="panelAttrs" @keydown="levels.onEscape">
            <div v-if="level === 'day'" ref="monthsRef" v-bind="part('months')">
                <div v-for="(month, i) in months" :key="month.key" v-bind="part('month')">
                    <div v-bind="part('header')">
                        <Button v-if="i === 0" :aria-label="locale.aria.previousMonth" variant="text" severity="secondary" size="small" :disabled="disabled" v-bind="part('prevButton')" @click="page(-1)">
                            <Icon icon="chevronLeft" />
                        </Button>
                        <!-- One line: the space between the two is the title's, and a line break would drop it. -->
                        <span v-bind="part('title')"><button v-if="monthPicker" v-tooltip="{ value: locale.aria.chooseMonth, showDelay: 400 }" type="button" :disabled="disabled" v-bind="part('monthButton')" @click="openLevel('month', i)">{{ month.monthName }}</button><span v-else v-bind="part('titleText')">{{ month.monthName }}</span>{{ ' ' }}<button v-if="yearPicker" v-tooltip="{ value: locale.aria.chooseYear, showDelay: 400 }" type="button" :disabled="disabled" v-bind="part('yearButton')" @click="openLevel('year', i)">{{ month.year }}</button><span v-else v-bind="part('titleText')">{{ month.year }}</span></span>
                        <Button v-if="i === months.length - 1" :aria-label="locale.aria.nextMonth" variant="text" severity="secondary" size="small" :disabled="disabled" v-bind="part('nextButton')" @click="page(1)">
                            <Icon icon="chevronRight" />
                        </Button>
                    </div>
                    <table role="grid" :aria-label="month.title" v-bind="part('grid')" @keydown="onGridKeydown" @mouseleave="hovered = null">
                        <thead>
                            <tr v-bind="part('weekdays')">
                                <th v-for="w in weekdays" :key="w.day" scope="col" :abbr="w.long" v-bind="part('weekday')">{{ w.short }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(week, w) in month.weeks" :key="w" v-bind="part('week')">
                                <template v-for="day in week" :key="day.date.getTime()">
                                    <td v-if="blank(day)" v-bind="part('day', { blank: true })" />
                                    <td
                                        v-else
                                        :tabindex="!disabled && isSameDay(day.date, tabDate) ? 0 : -1"
                                        :aria-selected="dayState(day).end || dayState(day).inRange ? 'true' : 'false'"
                                        :aria-current="day.today ? 'date' : undefined"
                                        :aria-disabled="disabled || dayState(day).disabled ? 'true' : undefined"
                                        :data-date="`${day.year}-${day.month + 1}-${day.day}`"
                                        v-bind="part('day', dayState(day))"
                                        @click="press(day, $event)"
                                        @mouseenter="hovered = day.date"
                                    >
                                        <span v-bind="part('dayLabel')">
                                            <slot name="date" :date="day.date" :day="day.day" :today="day.today" :in-range="dayState(day).inRange" :end="dayState(day).end" :disabled="dayState(day).disabled" :other-month="day.otherMonth">
                                                {{ day.day }}
                                            </slot>
                                        </span>
                                    </td>
                                </template>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div v-else :style="pickerSize" v-bind="part('picker', { level })">
                <div v-bind="part('header')">
                    <Button :aria-label="pageLabels.previous" variant="text" severity="secondary" size="small" :disabled="disabled || !levels.canPage.value.back" v-bind="part('prevButton')" @click="levels.page(-1)">
                        <Icon icon="chevronLeft" />
                    </Button>
                    <span aria-live="polite" aria-atomic="true" v-bind="part('title')">
                        <button v-if="level === 'month' && yearPicker" v-tooltip="{ value: locale.aria.chooseYear, showDelay: 400 }" type="button" :disabled="disabled" v-bind="part('yearButton')" @click="levels.open('year', months[pickedAt]!)">{{ pickerTitle }}</button>
                        <span v-else v-bind="part('titleText')">{{ pickerTitle }}</span>
                    </span>
                    <Button :aria-label="pageLabels.next" variant="text" severity="secondary" size="small" :disabled="disabled || !levels.canPage.value.forward" v-bind="part('nextButton')" @click="levels.page(1)">
                        <Icon icon="chevronRight" />
                    </Button>
                </div>
                <div role="grid" :aria-label="pickerTitle" v-bind="part('pickerGrid')" @keydown="levels.onKeydown">
                    <div v-for="(row, r) in pickerRows" :key="r" role="row" v-bind="part('pickerRow')">
                        <div
                            v-for="cell in row"
                            :key="cell.value"
                            role="gridcell"
                            :tabindex="!disabled && cell.active ? 0 : -1"
                            :aria-label="cell.name"
                            :aria-selected="cell.selected ? 'true' : 'false'"
                            :aria-current="cell.current ? 'date' : undefined"
                            :aria-disabled="disabled || cell.disabled ? 'true' : undefined"
                            :data-month="level === 'month' ? cell.value + 1 : undefined"
                            :data-year="level === 'year' ? cell.value : undefined"
                            v-bind="part('cell', cell)"
                            @click="levels.pick(cell)"
                        >
                            <span v-bind="part('cellLabel')">{{ cell.label }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="$slots.footer || showClearButton" v-bind="part('footer')">
                <slot name="footer" :range="value" :nights="nights" :clear="clear">
                    <Button :label="locale.clear" severity="secondary" variant="text" size="small" :disabled="disabled || !value.start" @click="clear" />
                </slot>
            </div>
        </div>
    </Teleport>
</template>

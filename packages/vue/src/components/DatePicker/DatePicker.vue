<script setup lang="ts">
import {
    addMonths,
    calendarKeyTarget,
    daysInMonth,
    formatDate,
    isDateSelectable,
    isMonthInRange,
    isSameDay,
    isSameMonth,
    isYearInRange,
    monthGrid,
    monthIndex,
    nearestSelectableDate,
    parseDate,
    pickerKeyTarget,
    startOfDay,
    weekdayOrder,
    yearPageStart,
    YEARS_PER_PAGE,
    type CalendarDay,
    type DateConstraints
} from '@vitral/core';
import { datepickerStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useId, watch } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { useFocusTrap } from '../../composables/useFocusTrap';
import { useOverlay } from '../../composables/useOverlay';
import Button from '../Button/Button.vue';
import Icon from '../Icon/Icon.vue';
import type { DatePickerEmits, DatePickerProps, DatePickerSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import { keepFocus } from '../../base/press';

// The WAI-ARIA "date picker dialog": a text box that takes typed dates, and a
// button that opens a modal calendar dialog. The calendar is a grid with one
// tabbable day (roving tabindex); focus lives in the dialog while it is open
// and goes back to the button when it closes. `inline` renders the calendar
// alone, in place.
//
// The month and the year in the title are buttons. Each swaps the days for a
// grid of its own — twelve months, or a page of years — so a date decades away
// is a year, a month and a day rather than hundreds of months paged through. A
// year leads to its months and a month back to its days; Escape goes back to
// the days with nothing changed.

defineOptions({ name: 'VtDatePicker', inheritAttrs: false });

const props = withDefaults(defineProps<DatePickerProps>(), {
    unstyled: undefined,
    variant: undefined,
    minDate: null,
    maxDate: null,
    placement: 'bottom-start',
    appendTo: 'body'
});
const overlayTarget = useOverlayTarget(() => props.appendTo);
const model = defineModel<Date | null>();
const emit = defineEmits<DatePickerEmits>();
defineSlots<DatePickerSlots>();

const { part, config, locale } = useComponent(datepickerStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();

const id = useId();
const dialogId = `${id}-dialog`;
const titleId = `${id}-title`;

const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const buttonRef = ref<HTMLButtonElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const gridRef = ref<HTMLElement | null>(null);

const open = ref(false);
const today = ref(startOfDay(new Date()));

const format = computed(() => props.dateFormat ?? locale.value.dateFormat);
const firstDay = computed(() => props.firstDayOfWeek ?? locale.value.firstDayOfWeek);
const constraints = computed<DateConstraints>(() => ({ min: props.minDate, max: props.maxDate, disabledDates: props.disabledDates, disabledDays: props.disabledDays }));
const value = computed(() => (model.value instanceof Date && !Number.isNaN(model.value.getTime()) ? model.value : null));
const selectable = (date: Date) => isDateSelectable(date, constraints.value);

// ---- the text box ----------------------------------------------------------

const formatted = computed(() => formatDate(value.value, format.value, locale.value));
const text = ref(formatted.value);
watch(formatted, (next) => (text.value = next));

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    readonly: props.readonly,
    fluid: props.fluid,
    focused: open.value
}));

function choose(date: Date | null) {
    const changed = date ? !isSameDay(date, value.value) : value.value !== null;
    model.value = date;
    if (date && changed) emit('dateSelect', date);
    if (!date && changed) emit('clear');
    text.value = formatted.value;
}

/** Reads what was typed: a real, selectable date is taken, empty text clears, anything else reverts. */
function commitText() {
    const typed = text.value.trim();
    if (typed === formatted.value) return;
    if (typed === '') return choose(null);
    const parsed = parseDate(typed, format.value);
    if (parsed && selectable(parsed)) choose(parsed);
    else text.value = formatted.value;
}

function onInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
        commitText();
    } else if (event.key === 'ArrowDown' && event.altKey) {
        event.preventDefault();
        commitText();
        show();
    }
}

function onInputBlur(event: FocusEvent) {
    commitText();
    emit('blur', event);
}

// A press on the field's padding focuses the text, as on a native text box.
function onRootPointerdown(event: PointerEvent) {
    const target = event.target as Element;
    if (target === inputRef.value || target.closest('button')) return;
    // Not prevented for a finger: the tap has to survive. The focus it was
    // taking is moved here either way.
    keepFocus(event);
    inputRef.value?.focus();
}

// ---- the calendar ----------------------------------------------------------

/** The day that owns the grid's tab stop and moves with the keys. */
const focusedDate = ref<Date>(today.value);
const view = ref({ year: today.value.getFullYear(), month: today.value.getMonth() });
const viewDate = computed(() => new Date(view.value.year, view.value.month, 1));

const weeks = computed(() => monthGrid(view.value.year, view.value.month, firstDay.value, today.value));
const weekdays = computed(() => weekdayOrder(firstDay.value).map((day) => ({ day, short: locale.value.dayNamesMin[day] ?? '', long: locale.value.dayNames[day] ?? '' })));
const monthName = computed(() => formatDate(viewDate.value, 'MMMM', locale.value));

/** The tabbable day: the focused one while it is in view, otherwise the first selectable day of the month. */
const activeDate = computed(() => {
    if (isSameMonth(focusedDate.value, viewDate.value)) return focusedDate.value;
    const days = weeks.value.flat().filter((d) => !d.otherMonth);
    return (days.find((d) => selectable(d.date)) ?? days[0]!).date;
});

const canGoBack = computed(() => {
    if (level.value === 'month') return isYearInRange(cursor.value.year - 1, constraints.value);
    if (level.value === 'year') return isYearInRange(pageStart.value - 1, constraints.value);
    return !props.minDate || viewDate.value > startOfDay(props.minDate);
});
const canGoForward = computed(() => {
    if (level.value === 'month') return isYearInRange(cursor.value.year + 1, constraints.value);
    if (level.value === 'year') return isYearInRange(pageStart.value + YEARS_PER_PAGE, constraints.value);
    return !props.maxDate || addMonths(viewDate.value, 1) <= startOfDay(props.maxDate);
});

function setView(date: Date) {
    const next = { year: date.getFullYear(), month: date.getMonth() };
    if (next.year === view.value.year && next.month === view.value.month) return;
    view.value = next;
    emit('monthChange', { ...next });
}

/** Where the calendar opens: the value, else today, else the nearest day that can be chosen. */
function initialDate(): Date {
    const start = value.value ? startOfDay(value.value) : today.value;
    return nearestSelectableDate(start, 1, constraints.value) ?? start;
}

function focusActiveCell() {
    nextTick(() => gridRef.value?.querySelector<HTMLElement>('[tabindex="0"]')?.focus({ preventScroll: true }));
}

function moveFocus(date: Date) {
    focusedDate.value = date;
    setView(date);
    focusActiveCell();
}

function pageMonth(step: 1 | -1) {
    const target = addMonths(viewDate.value, step);
    const candidate = addMonths(focusedDate.value, step);
    const near = nearestSelectableDate(candidate, step, constraints.value);
    focusedDate.value = near && isSameMonth(near, target) ? near : candidate;
    setView(target);
}

function dayState(day: CalendarDay) {
    // A disabled picker dims as a whole; a day of its own is struck through only when it cannot be chosen.
    return { selected: isSameDay(day.date, value.value), today: day.today, otherMonth: day.otherMonth, disabled: !selectable(day.date) };
}

function selectDay(day: CalendarDay) {
    if (props.disabled || props.readonly || !selectable(day.date)) return;
    level.value = 'day';
    focusedDate.value = day.date;
    setView(day.date);
    choose(new Date(day.year, day.month, day.day));
    if (props.inline) focusActiveCell();
    else hide();
}

function onGridKeydown(event: KeyboardEvent) {
    if (props.disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const day = weeks.value.flat().find((d) => isSameDay(d.date, activeDate.value));
        if (day) selectDay(day);
        return;
    }
    const target = calendarKeyTarget(activeDate.value, event.key, { shiftKey: event.shiftKey, firstDayOfWeek: firstDay.value, constraints: constraints.value });
    if (!target) return;
    event.preventDefault();
    moveFocus(target);
}

function selectToday() {
    today.value = startOfDay(new Date());
    if (!selectable(today.value)) return;
    const day = monthGrid(today.value.getFullYear(), today.value.getMonth(), firstDay.value, today.value)
        .flat()
        .find((d) => d.today && !d.otherMonth);
    if (day) selectDay(day);
}

function clearValue() {
    choose(null);
    level.value = 'day';
    if (props.inline) focusActiveCell();
    else hide();
}

// ---- the month and year grids ----------------------------------------------

const MONTH_COLUMNS = 3;
const YEAR_COLUMNS = 4;

interface PickerCell {
    /** A month, 0-based, or a year. */
    value: number;
    label: string;
    /** The month in full, for a cell that shows it short. */
    name?: string;
    selected: boolean;
    current: boolean;
    disabled: boolean;
    /** Owns the grid's tab stop. */
    active: boolean;
}

/** What the calendar is choosing: a day or, from the title, the month or the year the days are of. */
const level = ref<'day' | 'month' | 'year'>('day');
/** Where the month and year grids are. The days stay on their month until one is chosen here. */
const cursor = ref({ ...view.value });
const pageStart = computed(() => yearPageStart(cursor.value.year));

const monthLimits = computed(() => ({
    min: props.minDate ? monthIndex(props.minDate.getFullYear(), props.minDate.getMonth()) : null,
    max: props.maxDate ? monthIndex(props.maxDate.getFullYear(), props.maxDate.getMonth()) : null
}));

/** Moves the cursor to a month, held inside the range so its cell can always be chosen. */
function setCursor(index: number) {
    const { min, max } = monthLimits.value;
    const at = min !== null && index < min ? min : max !== null && index > max ? max : index;
    cursor.value = { year: Math.floor(at / 12), month: ((at % 12) + 12) % 12 };
}

const pickerRows = computed<PickerCell[][]>(() => {
    const { year, month } = cursor.value;
    const cells: PickerCell[] =
        level.value === 'month'
            ? Array.from({ length: 12 }, (_, m) => ({
                  value: m,
                  label: locale.value.monthNamesShort[m] ?? '',
                  name: locale.value.monthNames[m],
                  selected: !!value.value && value.value.getFullYear() === year && value.value.getMonth() === m,
                  current: today.value.getFullYear() === year && today.value.getMonth() === m,
                  disabled: !isMonthInRange(year, m, constraints.value),
                  active: m === month
              }))
            : Array.from({ length: YEARS_PER_PAGE }, (_, i) => {
                  const y = pageStart.value + i;
                  return { value: y, label: String(y), selected: value.value?.getFullYear() === y, current: today.value.getFullYear() === y, disabled: !isYearInRange(y, constraints.value), active: y === year };
              });
    const columns = level.value === 'month' ? MONTH_COLUMNS : YEAR_COLUMNS;
    return Array.from({ length: cells.length / columns }, (_, row) => cells.slice(row * columns, (row + 1) * columns));
});

function openLevel(next: 'month' | 'year') {
    if (props.disabled) return;
    if (level.value === 'day') setCursor(monthIndex(view.value.year, view.value.month));
    level.value = next;
    focusActiveCell();
}

function backToDays() {
    level.value = 'day';
    focusActiveCell();
}

/** A month shows its days, on the day of the month that had the focus where it can be. */
function pickMonth(month: number) {
    const { year } = cursor.value;
    if (!isMonthInRange(year, month, constraints.value)) return;
    const candidate = new Date(year, month, Math.min(focusedDate.value.getDate(), daysInMonth(year, month)));
    const near = nearestSelectableDate(candidate, 1, constraints.value);
    focusedDate.value = near && isSameMonth(near, candidate) ? near : candidate;
    setView(candidate);
    backToDays();
}

/** A year shows its months: the month is still to be said. */
function pickYear(year: number) {
    if (!isYearInRange(year, constraints.value)) return;
    setCursor(monthIndex(year, cursor.value.month));
    level.value = 'month';
    focusActiveCell();
}

function pickCell(cell: PickerCell) {
    if (props.disabled) return;
    if (level.value === 'month') pickMonth(cell.value);
    else pickYear(cell.value);
}

function onPickerKeydown(event: KeyboardEvent) {
    if (props.disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const cell = pickerRows.value.flat().find((c) => c.active);
        if (cell) pickCell(cell);
        return;
    }
    const { year, month } = cursor.value;
    if (level.value === 'month') {
        const target = pickerKeyTarget(monthIndex(year, month), event.key, { columns: MONTH_COLUMNS, page: 12, ...monthLimits.value });
        if (target === null) return;
        setCursor(target);
    } else {
        const target = pickerKeyTarget(year, event.key, { columns: YEAR_COLUMNS, page: YEARS_PER_PAGE, min: props.minDate?.getFullYear(), max: props.maxDate?.getFullYear() });
        if (target === null) return;
        setCursor(monthIndex(target, month));
    }
    event.preventDefault();
    focusActiveCell();
}

/** The header's arrows: a month of days, a year of months, a page of years. */
function page(step: 1 | -1) {
    if (level.value === 'day') return pageMonth(step);
    const months = level.value === 'month' ? 12 : 12 * YEARS_PER_PAGE;
    setCursor(monthIndex(cursor.value.year, cursor.value.month) + step * months);
}

const pageLabels = computed(() => {
    const { aria } = locale.value;
    if (level.value === 'month') return { previous: aria.previousYear, next: aria.nextYear };
    if (level.value === 'year') return { previous: aria.previousYears, next: aria.nextYears };
    return { previous: aria.previousMonth, next: aria.nextMonth };
});

// Escape leaves the month or the year grid before it leaves the calendar, and
// is kept from whatever the calendar is inside of: its own popup, or a dialog.
function onPanelKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || level.value === 'day') return;
    event.preventDefault();
    event.stopPropagation();
    backToDays();
}

// ---- the popup -------------------------------------------------------------

const overlayEl = computed(() => (props.inline ? null : panelRef.value));

useOverlay({
    anchor: rootRef,
    overlay: overlayEl,
    placement: () => props.placement,
    onEscape: () => hide(),
    onPointerDownOutside: () => hide(false)
});

// Modal, as the pattern asks: Tab cycles inside. Focus is placed and returned by hand,
// because a press outside closes without pulling focus back to the button.
useFocusTrap(overlayEl, open, { initialFocus: false, returnFocus: false });

function show() {
    if (props.inline || props.disabled || props.readonly || open.value) return;
    today.value = startOfDay(new Date());
    const start = initialDate();
    focusedDate.value = start;
    view.value = { year: start.getFullYear(), month: start.getMonth() };
    level.value = 'day';
    open.value = true;
    emit('show');
    focusActiveCell();
}

function hide(returnFocus = true) {
    if (!open.value) return;
    open.value = false;
    emit('hide');
    if (returnFocus) buttonRef.value?.focus();
}

function toggle() {
    if (open.value) hide();
    else show();
}

// The inline calendar follows its value, as the popup does each time it opens.
watch(
    () => (props.inline ? value.value?.getTime() : undefined),
    () => {
        if (!props.inline) return;
        const start = initialDate();
        focusedDate.value = start;
        setView(start);
    },
    { immediate: true }
);

const panelAttrs = computed(() => {
    if (!props.inline) return { id: dialogId, role: 'dialog', 'aria-modal': 'true', 'aria-label': locale.value.aria.chooseDate };
    // Inline, the calendar is the component: it takes the attributes, and its name, unless one is given.
    const named = controlAttrs.value['aria-label'] || controlAttrs.value['aria-labelledby'];
    return mergeProps(rootAttrs.value, controlAttrs.value, { role: 'group', 'aria-labelledby': named ? undefined : titleId });
});

defineExpose({ show, hide, focus: () => (props.inline ? focusActiveCell() : inputRef.value?.focus()) });
</script>

<template>
    <div v-if="!inline" ref="rootRef" v-bind="mergeProps(rootAttrs, part('root', state))" @pointerdown="onRootPointerdown">
        <input
            ref="inputRef"
            type="text"
            autocomplete="off"
            v-bind="mergeProps(controlAttrs, part('input'))"
            :value="text"
            :placeholder="placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :aria-invalid="invalid ? 'true' : undefined"
            @input="text = ($event.target as HTMLInputElement).value"
            @keydown="onInputKeydown"
            @focus="emit('focus', $event)"
            @blur="onInputBlur"
        />
        <button
            ref="buttonRef"
            type="button"
            v-bind="part('dropdown')"
            :disabled="disabled || readonly"
            :aria-label="locale.aria.chooseDate"
            aria-haspopup="dialog"
            :aria-expanded="open ? 'true' : 'false'"
            :aria-controls="open ? dialogId : undefined"
            @click="toggle"
        >
            <slot name="dropdownicon"><Icon icon="calendar" /></slot>
        </button>
    </div>
    <Teleport :to="overlayTarget" :disabled="inline || appendTo === 'self'">
        <Transition name="vt-overlay">
            <div v-if="inline || open" ref="panelRef" v-bind="mergeProps(panelAttrs, part('panel', { inline, disabled }))" @keydown="onPanelKeydown">
                <div v-bind="part('header')">
                    <div :id="titleId" aria-live="polite" aria-atomic="true" v-bind="part('title')">
                        <!-- One line: the space between the two is the title's, and a line break would drop it. -->
                        <template v-if="level === 'day'"><button type="button" v-bind="part('monthButton')" :title="locale.aria.chooseMonth" :disabled="disabled" @click="openLevel('month')">{{ monthName }}</button>{{ ' ' }}<button type="button" v-bind="part('yearButton')" :title="locale.aria.chooseYear" :disabled="disabled" @click="openLevel('year')">{{ view.year }}</button></template>
                        <button v-else-if="level === 'month'" type="button" v-bind="part('yearButton')" :title="locale.aria.chooseYear" :disabled="disabled" @click="openLevel('year')">{{ cursor.year }}</button>
                        <template v-else>{{ pageStart }} – {{ pageStart + YEARS_PER_PAGE - 1 }}</template>
                    </div>
                    <Button
                        v-bind="part('prevButton')"
                        variant="text"
                        severity="secondary"
                        size="small"
                        icon="chevronLeft"
                        :disabled="disabled || !canGoBack"
                        :aria-label="pageLabels.previous"
                        @click="page(-1)"
                    />
                    <Button
                        v-bind="part('nextButton')"
                        variant="text"
                        severity="secondary"
                        size="small"
                        icon="chevronRight"
                        :disabled="disabled || !canGoForward"
                        :aria-label="pageLabels.next"
                        @click="page(1)"
                    />
                </div>
                <table v-if="level === 'day'" ref="gridRef" role="grid" :aria-labelledby="titleId" v-bind="part('grid')" @keydown="onGridKeydown">
                    <thead>
                        <tr v-bind="part('weekdays')">
                            <th v-for="w in weekdays" :key="w.day" scope="col" :abbr="w.long" v-bind="part('weekday')">{{ w.short }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(week, w) in weeks" :key="w" v-bind="part('week')">
                            <td
                                v-for="day in week"
                                :key="day.date.getTime()"
                                :tabindex="!disabled && isSameDay(day.date, activeDate) ? 0 : -1"
                                :aria-selected="isSameDay(day.date, value) ? 'true' : 'false'"
                                :aria-current="day.today ? 'date' : undefined"
                                :aria-disabled="disabled || dayState(day).disabled ? 'true' : undefined"
                                :data-date="`${day.year}-${day.month + 1}-${day.day}`"
                                v-bind="part('day', dayState(day))"
                                @click="selectDay(day)"
                            >
                                <span v-bind="part('dayLabel')">
                                    <slot name="date" :date="day.date" :day="day.day" :today="day.today" :selected="isSameDay(day.date, value)" :disabled="disabled || dayState(day).disabled" :otherMonth="day.otherMonth">{{
                                        day.day
                                    }}</slot>
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div v-else ref="gridRef" role="grid" :aria-labelledby="titleId" v-bind="part('picker', { level })" @keydown="onPickerKeydown">
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
                            @click="pickCell(cell)"
                        >
                            <span v-bind="part('cellLabel')">{{ cell.label }}</span>
                        </div>
                    </div>
                </div>
                <div v-if="showTodayButton || showClearButton || $slots.footer" v-bind="part('footer')">
                    <Button v-if="showTodayButton" v-bind="part('todayButton')" :label="locale.today" variant="text" size="small" :disabled="disabled || readonly || !selectable(today)" @click="selectToday" />
                    <slot name="footer" />
                    <Button v-if="showClearButton" v-bind="part('clearButton')" :label="locale.clear" variant="text" severity="secondary" size="small" :disabled="disabled || readonly" @click="clearValue" />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

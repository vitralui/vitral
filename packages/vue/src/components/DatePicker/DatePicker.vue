<script setup lang="ts">
import {
    addMonths,
    calendarKeyTarget,
    atMinutesOfDay,
    daysInMonth,
    formatDate,
    formatMinutes,
    isDateSelectable,
    isSameDay,
    isSameMonth,
    monthGrid,
    nearestSelectableDate,
    parseDate,
    parseMinutes,
    startOfDay,
    usesHour12,
    weekdayOrder,
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
import TimePicker from '../TimePicker/TimePicker.vue';
import type { DatePickerEmits, DatePickerProps, DatePickerSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import { keepFocus } from '../../base/press';
import { useCalendarLevels } from '../../base/useCalendarLevels';
import { Tooltip as vTooltip } from '../../directives/tooltip';

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
// the days with nothing changed. `monthPicker` and `yearPicker` turn either
// off, for a form that wants its dates paged to and not jumped to.
//
// `showTime` adds a time of day: a TimePicker under the days, whose list is a
// layer above the dialog, so a press in it does not close the calendar. A day
// then keeps the time already chosen and leaves the calendar open for it.

defineOptions({ name: 'VtDatePicker', inheritAttrs: false });

const props = withDefaults(defineProps<DatePickerProps>(), {
    unstyled: undefined,
    variant: undefined,
    minDate: null,
    maxDate: null,
    monthPicker: true,
    yearPicker: true,
    timeStep: 30,
    // Absent, not false: it has to tell "what the locale writes" from "asked for twenty-four hour".
    hour12: undefined,
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

// ---- the time --------------------------------------------------------------

const twelve = computed(() => props.hour12 ?? usesHour12(locale.value.code));
const minutesOf = (date: Date) => date.getHours() * 60 + date.getMinutes();
const writeTime = (date: Date) => formatMinutes(minutesOf(date), { locale: locale.value.code, hour12: twelve.value });

/** The time field's value. Set before a day is chosen, it goes on the day the calendar is on. */
const time = computed<number | null>({
    get: () => (value.value ? minutesOf(value.value) : null),
    set: (minutes) => {
        const day = value.value ?? (selectable(activeDate.value) ? activeDate.value : null);
        if (day) choose(atMinutesOfDay(startOfDay(day), minutes ?? 0));
    }
});

// A time written after the date: `14:30`, `2:30 PM`, `14h30`.
const trailingTime = /\s*(\d{1,2}\s*[:h.]\s*\d{2}(?:\s*:\s*\d{2})?\s*(?:[ap]\.?\s*m\.?)?)\s*$/i;

// ---- the text box ----------------------------------------------------------

const formatted = computed(() => {
    const date = formatDate(value.value, format.value, locale.value);
    return props.showTime && value.value ? `${date} ${writeTime(value.value)}` : date;
});
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
    const changed = date ? (props.showTime ? date.getTime() !== value.value?.getTime() : !isSameDay(date, value.value)) : value.value !== null;
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
    if (props.showTime) return commitDateTime(typed);
    const parsed = parseDate(typed, format.value);
    if (parsed && selectable(parsed)) choose(parsed);
    else text.value = formatted.value;
}

/** A date with a time after it; with none, the time already chosen is kept. */
function commitDateTime(typed: string) {
    const match = trailingTime.exec(typed);
    const minutes = match ? parseMinutes(match[1]!, twelve.value) : value.value ? minutesOf(value.value) : 0;
    const parsed = parseDate(match ? typed.slice(0, match.index) : typed, format.value);
    if (parsed && minutes !== null && selectable(parsed)) choose(atMinutesOfDay(parsed, minutes));
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
    if (level.value !== 'day') return levels.canPage.value.back;
    return !props.minDate || viewDate.value > startOfDay(props.minDate);
});
const canGoForward = computed(() => {
    if (level.value !== 'day') return levels.canPage.value.forward;
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
    const chosen = new Date(day.year, day.month, day.day);
    choose(props.showTime && value.value ? atMinutesOfDay(chosen, minutesOf(value.value)) : chosen);
    if (props.inline || props.showTime) focusActiveCell();
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

const levels = useCalendarLevels({
    locale,
    constraints: () => constraints.value,
    today: () => today.value,
    monthPicker: () => props.monthPicker,
    yearPicker: () => props.yearPicker,
    disabled: () => !!props.disabled,
    selected: (year, month) => !!value.value && value.value.getFullYear() === year && (month === undefined || value.value.getMonth() === month),
    // A month shows its days, on the day of the month that had the focus where it can be.
    onMonth(year, month) {
        const candidate = new Date(year, month, Math.min(focusedDate.value.getDate(), daysInMonth(year, month)));
        const near = nearestSelectableDate(candidate, 1, constraints.value);
        focusedDate.value = near && isSameMonth(near, candidate) ? near : candidate;
        setView(candidate);
    },
    focus: focusActiveCell
});
const { level, rows: pickerRows, title: pickerTitle, pageLabels } = levels;

/** The header's arrows: a month of days, a year of months, a page of years. */
function page(step: 1 | -1) {
    if (level.value === 'day') pageMonth(step);
    else levels.page(step);
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
            <div v-if="inline || open" ref="panelRef" v-bind="mergeProps(panelAttrs, part('panel', { inline, disabled }))" @keydown="levels.onEscape">
                <div v-bind="part('header')">
                    <div :id="titleId" aria-live="polite" aria-atomic="true" v-bind="part('title')">
                        <!-- One line: the space between the two is the title's, and a line break would drop it. -->
                        <template v-if="level === 'day'"><button v-if="monthPicker" v-tooltip="{ value: locale.aria.chooseMonth, showDelay: 400 }" type="button" v-bind="part('monthButton')" :disabled="disabled" @click="levels.open('month', view)">{{ monthName }}</button><span v-else v-bind="part('titleText')">{{ monthName }}</span>{{ ' ' }}<button v-if="yearPicker" v-tooltip="{ value: locale.aria.chooseYear, showDelay: 400 }" type="button" v-bind="part('yearButton')" :disabled="disabled" @click="levels.open('year', view)">{{ view.year }}</button><span v-else v-bind="part('titleText')">{{ view.year }}</span></template>
                        <button v-else-if="level === 'month' && yearPicker" v-tooltip="{ value: locale.aria.chooseYear, showDelay: 400 }" type="button" v-bind="part('yearButton')" :disabled="disabled" @click="levels.open('year', view)">{{ pickerTitle }}</button>
                        <span v-else v-bind="part('titleText')">{{ pickerTitle }}</span>
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
                <div v-else ref="gridRef" role="grid" :aria-labelledby="titleId" v-bind="part('picker', { level })" @keydown="levels.onKeydown">
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
                <div v-if="showTime && level === 'day'" v-bind="part('time')">
                    <label :for="`${id}-time`" v-bind="part('timeLabel')">{{ locale.time }}</label>
                    <TimePicker
                        :id="`${id}-time`"
                        v-model="time"
                        v-bind="part('timePicker')"
                        :step="timeStep"
                        :hour12="twelve"
                        :size="size === 'large' ? undefined : 'small'"
                        :disabled="disabled"
                        :readonly="readonly"
                        fluid
                    />
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

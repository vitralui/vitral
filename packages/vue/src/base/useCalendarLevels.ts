import { isMonthInRange, isYearInRange, monthIndex, pickerKeyTarget, yearPageStart, YEARS_PER_PAGE, type DateConstraints, type Locale } from '@vitral/core';
import { computed, ref, type Ref } from 'vue';

// What the date picker and the date range share above their days: the month
// and the year in a calendar's title are buttons, and each swaps the days for
// a grid of its own — twelve months, or a page of years — so a date decades
// away is a year, a month and a day rather than hundreds of months paged
// through. A year leads to its months and a month back to its days; Escape
// goes back to the days with nothing changed.
//
// Either grid can be left out. Without the month grid a year goes straight
// back to the days, on the month they were showing; without both the title is
// only text. Each component draws the grids in its own parts.

export type CalendarLevel = 'day' | 'month' | 'year';

export const MONTH_COLUMNS = 3;
export const YEAR_COLUMNS = 4;

export interface CalendarCell {
    /** A month, 0-based, or a year. */
    value: number;
    label: string;
    /** The month in full, for a cell that shows it short. */
    name?: string;
    selected: boolean;
    /** The month or the year today is in. */
    current: boolean;
    disabled: boolean;
    /** Owns the grid's tab stop. */
    active: boolean;
}

export interface CalendarLevelsOptions {
    locale: Ref<Locale>;
    constraints: () => DateConstraints;
    today: () => Date;
    /** Whether the month in the title opens the grid of months. */
    monthPicker: () => boolean;
    /** Whether the year in the title opens the grid of years. */
    yearPicker: () => boolean;
    disabled: () => boolean;
    /** Whether the value is in a month or, with no month given, anywhere in a year. */
    selected: (year: number, month?: number) => boolean;
    /** A month was chosen: the days are on show again, and this is the month they should be of. */
    onMonth: (year: number, month: number) => void;
    /** Puts the focus on the tab stop of whatever grid is on show, once it is drawn. */
    focus: () => void;
}

export function useCalendarLevels(options: CalendarLevelsOptions) {
    /** What the calendar is choosing: a day or, from the title, the month or the year the days are of. */
    const level = ref<CalendarLevel>('day');
    /** Where the month and year grids are. The days stay on their month until one is chosen here. */
    const cursor = ref({ year: options.today().getFullYear(), month: options.today().getMonth() });
    const pageStart = computed(() => yearPageStart(cursor.value.year));

    const monthLimits = computed(() => {
        const { min, max } = options.constraints();
        return { min: min ? monthIndex(min.getFullYear(), min.getMonth()) : null, max: max ? monthIndex(max.getFullYear(), max.getMonth()) : null };
    });

    /** Moves the cursor to a month, held inside the range so its cell can always be chosen. */
    function setCursor(index: number) {
        const { min, max } = monthLimits.value;
        const at = min !== null && index < min ? min : max !== null && index > max ? max : index;
        cursor.value = { year: Math.floor(at / 12), month: ((at % 12) + 12) % 12 };
    }

    const rows = computed<CalendarCell[][]>(() => {
        if (level.value === 'day') return [];
        const { year, month } = cursor.value;
        const locale = options.locale.value;
        const constraints = options.constraints();
        const today = options.today();
        const cells: CalendarCell[] =
            level.value === 'month'
                ? Array.from({ length: 12 }, (_, m) => ({
                      value: m,
                      label: locale.monthNamesShort[m] ?? '',
                      name: locale.monthNames[m],
                      selected: options.selected(year, m),
                      current: today.getFullYear() === year && today.getMonth() === m,
                      disabled: !isMonthInRange(year, m, constraints),
                      active: m === month
                  }))
                : Array.from({ length: YEARS_PER_PAGE }, (_, i) => {
                      const y = pageStart.value + i;
                      return { value: y, label: String(y), selected: options.selected(y), current: today.getFullYear() === y, disabled: !isYearInRange(y, constraints), active: y === year };
                  });
        const columns = level.value === 'month' ? MONTH_COLUMNS : YEAR_COLUMNS;
        return Array.from({ length: cells.length / columns }, (_, row) => cells.slice(row * columns, (row + 1) * columns));
    });

    /** The title of the grid on show: the year its months are of, or the years on the page. */
    const title = computed(() => (level.value === 'month' ? String(cursor.value.year) : `${pageStart.value} – ${pageStart.value + YEARS_PER_PAGE - 1}`));

    /** Opens the month or the year grid, starting from the month the days are showing. */
    function open(next: 'month' | 'year', from: { year: number; month: number }) {
        if (options.disabled() || !(next === 'month' ? options.monthPicker() : options.yearPicker())) return;
        if (level.value === 'day') setCursor(monthIndex(from.year, from.month));
        level.value = next;
        options.focus();
    }

    function back() {
        level.value = 'day';
        options.focus();
    }

    /** Back to the days without moving the focus: the calendar opened again, or a day was chosen some other way. */
    function reset() {
        level.value = 'day';
    }

    function showDays(year: number, month: number) {
        level.value = 'day';
        options.onMonth(year, month);
        options.focus();
    }

    function pick(cell: CalendarCell) {
        if (options.disabled() || cell.disabled) return;
        if (level.value === 'month') return showDays(cursor.value.year, cell.value);
        // A year is not a date yet. Its months come next, unless the month is not this grid's to change.
        setCursor(monthIndex(cell.value, cursor.value.month));
        if (!options.monthPicker()) return showDays(cursor.value.year, cursor.value.month);
        level.value = 'month';
        options.focus();
    }

    function onKeydown(event: KeyboardEvent) {
        if (options.disabled() || level.value === 'day') return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const cell = rows.value.flat().find((c) => c.active);
            if (cell) pick(cell);
            return;
        }
        const { year, month } = cursor.value;
        if (level.value === 'month') {
            const target = pickerKeyTarget(monthIndex(year, month), event.key, { columns: MONTH_COLUMNS, page: 12, ...monthLimits.value });
            if (target === null) return;
            setCursor(target);
        } else {
            const { min, max } = options.constraints();
            const target = pickerKeyTarget(year, event.key, { columns: YEAR_COLUMNS, page: YEARS_PER_PAGE, min: min?.getFullYear(), max: max?.getFullYear() });
            if (target === null) return;
            setCursor(monthIndex(target, month));
        }
        event.preventDefault();
        options.focus();
    }

    /** The header's arrows above a grid: a year of months, or a page of years. */
    function page(step: 1 | -1) {
        if (level.value === 'day') return;
        const months = level.value === 'month' ? 12 : 12 * YEARS_PER_PAGE;
        setCursor(monthIndex(cursor.value.year, cursor.value.month) + step * months);
    }

    const canPage = computed(() => {
        const constraints = options.constraints();
        if (level.value === 'month') return { back: isYearInRange(cursor.value.year - 1, constraints), forward: isYearInRange(cursor.value.year + 1, constraints) };
        return { back: isYearInRange(pageStart.value - 1, constraints), forward: isYearInRange(pageStart.value + YEARS_PER_PAGE, constraints) };
    });

    /** What the header's arrows are called, which is what they page. */
    const pageLabels = computed(() => {
        const { aria } = options.locale.value;
        if (level.value === 'month') return { previous: aria.previousYear, next: aria.nextYear };
        if (level.value === 'year') return { previous: aria.previousYears, next: aria.nextYears };
        return { previous: aria.previousMonth, next: aria.nextMonth };
    });

    // Escape leaves the month or the year grid before it leaves the calendar, and
    // is kept from whatever the calendar is inside of: its own popup, or a dialog.
    function onEscape(event: KeyboardEvent) {
        if (event.key !== 'Escape' || level.value === 'day') return;
        event.preventDefault();
        event.stopPropagation();
        back();
    }

    return { level, cursor, rows, title, open, back, reset, pick, onKeydown, page, canPage, pageLabels, onEscape };
}

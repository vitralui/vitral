import {
    addMonths,
    calendarKeyTarget,
    en,
    formatDate,
    isDateSelectable,
    isInRange,
    isRangeEnd,
    isSameDay,
    loadStyle,
    monthGrid,
    normalizeDateRange,
    parseDate,
    pressRange,
    previewRange,
    startOfDay,
    weekdayOrder,
    type CalendarDay,
    type ClassEntry,
    type DateConstraints,
    type DateRange,
    type Locale
} from '@vitral/core';
import { createRoot, h, iconNode, mergeAttrs, partResolver, type Child, type PassThrough, type VElement } from '@vitral/dom';
import { getIcon } from '@vitral/icons';
import { baseStyle, buttonStyle, daterangeStyle } from '@vitral/styles';
import { createOverlay, type OverlayTarget } from './overlay';

/**
 * A span of days with no framework in it: a text box that takes two dates
 * typed in the locale's format with the separator between, and a button that
 * opens months side by side to press the first day and the last on. Drawn
 * with the classes the Vue DateRange wears, so the two look the same: while
 * only the start is chosen, the days up to the one under the pointer or the
 * keyboard show the span it would make.
 */

export interface DateRangeConfig {
    value?: DateRange | null;
    /** How many months side by side, one to three. Defaults to 2. */
    months?: number;
    /** Whether the days either side of a month are drawn; on for one month and off for several by default. */
    showOtherMonths?: boolean;
    min?: Date | null;
    max?: Date | null;
    /** How a date is written and read; the locale's `dateFormat` by default. */
    dateFormat?: string;
    /** Between the two dates in the box. Defaults to `–`; a typed ` - ` is read as well. */
    separator?: string;
    placeholder?: string;
    disabled?: boolean;
    size?: 'small' | 'large';
    fluid?: boolean;
    invalid?: boolean;
    /** Clear under the months. Off by default, as on the Vue DateRange. */
    showClearButton?: boolean;
    ariaLabel?: string;
    ariaLabelledby?: string;
    /** Prefix of the ids it gives its elements; generated when unset. */
    id?: string;
    locale?: Locale;
    unstyled?: boolean;
    classes?: Partial<Record<string, ClassEntry>>;
    pt?: PassThrough;
    /** Where the months are put; the nearest overlay scope by default. */
    overlayTarget?: OverlayTarget;
    zIndex?: number;
    nonce?: string;
    cssLayer?: string | false;
    /** The range changed: a start alone while the end is still to come, both ends, or neither when cleared. */
    onChange?: (range: DateRange) => void;
    /** Extra attributes for the text box, such as `data-*` hooks. */
    inputAttrs?: Record<string, unknown>;
}

export interface DateRangeHandle {
    update(config: Partial<DateRangeConfig>): void;
    /** The range as it stands. */
    value(): DateRange;
    open(): void;
    close(): void;
    focus(): void;
    destroy(): void;
    readonly element: HTMLElement;
}

let counter = 0;

const none = (): DateRange => ({ start: null, end: null });
const same = (a: DateRange, b: DateRange) => (a.start ? isSameDay(a.start, b.start) : !b.start) && (a.end ? isSameDay(a.end, b.end) : !b.end);

export function createDateRange(element: HTMLElement, config: DateRangeConfig = {}): DateRangeHandle {
    let current: DateRangeConfig = { ...config };
    let value: DateRange = normalizeDateRange(config.value ?? none());
    let text = '';
    /** The day the keyboard is on. */
    let active = startOfDay(value.start ?? new Date());
    /** The first month on show. */
    let view = new Date(active.getFullYear(), active.getMonth(), 1);
    /** The day under the pointer, standing for the end while only the start is chosen. */
    let hovered: Date | null = null;
    /** Whether the keyboard has moved in the months since they opened: only then does its day preview the end. */
    let keyed = false;
    let input: HTMLInputElement | null = null;
    let button: HTMLButtonElement | null = null;

    const id = config.id ?? `vt-daterange-${++counter}`;
    const dialogId = `${id}-dialog`;
    const root = createRoot(element);
    const locale = (): Locale => current.locale ?? en;
    const pattern = () => current.dateFormat ?? locale().dateFormat;
    const separator = () => current.separator ?? '–';
    const count = () => Math.max(1, Math.min(3, Math.round(current.months ?? 2)));
    const constraints = (): DateConstraints => ({ min: current.min, max: current.max });
    const selectable = (date: Date) => isDateSelectable(date, constraints());
    const part = partResolver({
        style: daterangeStyle,
        unstyled: () => !!current.unstyled,
        classes: () => current.classes,
        pt: () => current.pt,
        props: () => current as Record<string, unknown>
    });
    const buttonPart = partResolver({ style: buttonStyle, unstyled: () => !!current.unstyled, props: () => ({}) });

    if (!config.unstyled) {
        const options = { nonce: config.nonce, cssLayer: config.cssLayer };
        loadStyle(baseStyle.name, baseStyle.css, options);
        loadStyle(buttonStyle.name, buttonStyle.css, options);
        loadStyle(daterangeStyle.name, daterangeStyle.css, options);
    }

    const write = (date: Date) => formatDate(date, pattern(), locale());
    const written = (range: DateRange) => (range.start ? (range.end ? `${write(range.start)} ${separator()} ${write(range.end)}` : write(range.start)) : '');
    text = written(value);

    /** A range as typed, in order; null for empty text, false when it cannot be read. */
    function read(typed: string): DateRange | null | false {
        const trimmed = typed.trim();
        if (!trimmed) return null;
        // The separator, or a dash with space round it, so a date written with dashes is not cut; one left at the end waits for the end.
        const parts = (trimmed.includes(separator()) ? trimmed.split(separator()) : trimmed.replace(/\s+-$/, '').split(/\s+-\s+/)).map((p) => p.trim());
        if (parts.length > 2) return false;
        const start = parseDate(parts[0] ?? '', pattern());
        const end = parts[1] ? parseDate(parts[1], pattern()) : null;
        if (!start || !selectable(start) || (parts[1] && !(end && selectable(end)))) return false;
        return normalizeDateRange({ start, end });
    }

    function set(next: DateRange) {
        const changed = !same(next, value);
        value = next;
        text = written(value);
        if (changed) current.onChange?.({ ...value });
    }

    /**
     * What is being typed, read as it is typed: once it is a whole range, or a
     * whole start, it is the value, so a form or a grid that reads it on Enter
     * or Tab, before the box is left, has it.
     */
    function onTyped(typed: string) {
        text = typed;
        const range = read(typed);
        if (range === false) return;
        const next = range ?? none();
        if (same(next, value)) return;
        value = next;
        current.onChange?.({ ...value });
    }

    /** What was typed, read when the box is left or Enter is pressed: a range, nothing, or put back as it was. */
    function commitText() {
        const range = read(text);
        if (range !== false) set(range ?? none());
        else text = written(value);
        render();
    }

    // ---- the months -----------------------------------------------------------------------

    const overlay = createOverlay({
        anchor: () => element,
        render: () => panelView(),
        placement: 'bottom-start',
        target: () => current.overlayTarget,
        zIndex: current.zIndex,
        inside: () => [element, overlay.element()],
        onOpen: () => {
            active = startOfDay(value.start ?? new Date());
            view = new Date(active.getFullYear(), active.getMonth(), 1);
            hovered = null;
            keyed = false;
            overlay.update();
            render();
            focusActive();
        },
        onClose: () => render()
    });

    const key = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

    function focusActive() {
        overlay.element()?.querySelector<HTMLElement>(`[data-date="${key(active)}"]:not([data-blank])`)?.focus();
    }

    function move(to: Date) {
        active = startOfDay(to);
        keyed = true;
        // The moving day leads the months rather than the months trapping it.
        const last = addMonths(view, count() - 1);
        if (active < view) view = new Date(active.getFullYear(), active.getMonth(), 1);
        else if (active > new Date(last.getFullYear(), last.getMonth() + 1, 0)) view = addMonths(new Date(active.getFullYear(), active.getMonth(), 1), -(count() - 1));
        overlay.update();
        focusActive();
    }

    function press(date: Date) {
        if (current.disabled || !selectable(date)) return;
        active = startOfDay(date);
        hovered = null;
        set(pressRange(value, date));
        if (value.end) {
            overlay.close('request');
            input?.focus();
        } else {
            overlay.update();
            focusActive();
        }
        render();
    }

    function hover(date: Date | null) {
        if (date ? isSameDay(date, hovered) : !hovered) return;
        hovered = date;
        overlay.update();
    }

    function onGridKeydown(event: KeyboardEvent) {
        if (current.disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            press(active);
            return;
        }
        const target = calendarKeyTarget(active, event.key, { shiftKey: event.shiftKey, firstDayOfWeek: locale().firstDayOfWeek, constraints: constraints() });
        if (!target) return;
        event.preventDefault();
        move(target);
    }

    function panelView(): VElement {
        const words = locale();
        const today = startOfDay(new Date());
        const shown = previewRange(value, hovered ?? (keyed ? active : null));
        const previewing = !value.end && !!shown.end;
        const showOther = current.showOtherMonths ?? count() === 1;
        // The tab stop: the keyboard's day where it is drawn, else the first of the months on show.
        const drawn = (date: Date) => date >= view && date < addMonths(view, count());
        const tabDate = drawn(active) || showOther ? active : view;

        const dayView = (day: CalendarDay) => {
            if (!showOther && day.otherMonth) return h('td', mergeAttrs({ key: key(day.date) }, part('day', { blank: true }), { 'data-blank': '' }));
            const end = isRangeEnd(day.date, shown);
            const inRange = isInRange(day.date, shown) && !end;
            const disabled = !selectable(day.date);
            return h(
                'td',
                mergeAttrs({ key: key(day.date) }, part('day', { end, inRange, preview: previewing, today: day.today, otherMonth: day.otherMonth, disabled }), {
                    tabindex: isSameDay(day.date, tabDate) ? 0 : -1,
                    'data-date': key(day.date),
                    'aria-selected': end || inRange ? 'true' : 'false',
                    'aria-current': day.today ? 'date' : undefined,
                    'aria-disabled': disabled ? 'true' : undefined,
                    'aria-label': formatDate(day.date, 'd MMMM yyyy', words),
                    onClick: () => press(day.date),
                    onMouseenter: () => hover(day.date)
                }),
                h('span', part('dayLabel'), String(day.day))
            );
        };
        // The months' arrows: small text buttons with only an icon, as the Vue DateRange draws them.
        const pageButton = (name: string, own: Record<string, unknown>, label: string, icon: string, step: 1 | -1) =>
            h(
                'button',
                mergeAttrs({ key: name, type: 'button' }, buttonPart('root', { variant: 'text', severity: 'secondary', size: 'small', iconOnly: true }), own, {
                    'aria-label': label,
                    disabled: current.disabled,
                    onClick: () => {
                        view = addMonths(view, step);
                        overlay.update();
                    }
                }),
                h('span', buttonPart('icon'), iconView(icon))
            );
        const monthView = (at: number) => {
            const month = addMonths(view, at);
            const title = `${words.monthNames[month.getMonth()]} ${month.getFullYear()}`;
            const weeks = monthGrid(month.getFullYear(), month.getMonth(), words.firstDayOfWeek, today);
            return h(
                'div',
                mergeAttrs({ key: `${month.getFullYear()}-${month.getMonth()}` }, part('month')),
                h(
                    'div',
                    part('header'),
                    at === 0 ? pageButton('prev', part('prevButton'), words.aria.previousMonth, 'chevronLeft', -1) : null,
                    h('span', mergeAttrs(part('title'), { 'aria-live': 'polite', 'aria-atomic': 'true' }), h('span', part('titleText'), title)),
                    at === count() - 1 ? pageButton('next', part('nextButton'), words.aria.nextMonth, 'chevronRight', 1) : null
                ),
                h(
                    'table',
                    mergeAttrs(part('grid'), { role: 'grid', 'aria-label': title, onKeydown: onGridKeydown, onMouseleave: () => hover(null) }),
                    h(
                        'thead',
                        null,
                        h(
                            'tr',
                            part('weekdays'),
                            weekdayOrder(words.firstDayOfWeek).map((day) =>
                                h('th', mergeAttrs({ key: day, scope: 'col', abbr: words.dayNames[day] }, part('weekday')), words.dayNamesMin?.[day] ?? words.dayNamesShort[day])
                            )
                        )
                    ),
                    h(
                        'tbody',
                        null,
                        weeks.map((week, row) => h('tr', mergeAttrs({ key: row }, part('week')), week.map(dayView)))
                    )
                )
            );
        };
        return h(
            'div',
            mergeAttrs({ key: 'panel' }, part('panel', { disabled: current.disabled }), { id: dialogId, role: 'dialog', 'aria-modal': 'true', 'aria-label': words.aria.chooseDate }),
            h(
                'div',
                part('months'),
                Array.from({ length: count() }, (_, at) => monthView(at))
            ),
            current.showClearButton
                ? h(
                      'div',
                      mergeAttrs({ key: 'footer' }, part('footer')),
                      h(
                          'button',
                          mergeAttrs({ key: 'clear', type: 'button' }, buttonPart('root', { variant: 'text', size: 'small', severity: 'secondary' }), {
                              disabled: current.disabled || !value.start,
                              onClick: () => {
                                  set(none());
                                  overlay.close('request');
                                  input?.focus();
                                  render();
                              }
                          }),
                          h('span', buttonPart('label'), words.clear)
                      )
                  )
                : null
        );
    }

    // ---- drawing ---------------------------------------------------------------------------

    function render() {
        const open = overlay.isOpen;
        root.attrs(part('root', { size: current.size, fluid: current.fluid, invalid: current.invalid, disabled: current.disabled }));
        root.render([
            h(
                'input',
                mergeAttrs({ key: 'input', type: 'text', autocomplete: 'off' }, part('input'), current.inputAttrs ?? {}, {
                    id,
                    value: text,
                    placeholder: current.placeholder ?? `${pattern()} ${separator()} ${pattern()}`.toLowerCase(),
                    disabled: current.disabled,
                    'aria-label': current.ariaLabel,
                    'aria-labelledby': current.ariaLabelledby,
                    'aria-invalid': current.invalid ? 'true' : undefined,
                    ref: (el: Element | null) => (input = el as HTMLInputElement | null),
                    onInput: (event: Event) => onTyped((event.target as HTMLInputElement).value),
                    onBlur: commitText,
                    onKeydown: (event: KeyboardEvent) => {
                        // Enter is left to go on to whatever holds the field, with the range already read.
                        if (event.key === 'Enter') commitText();
                        else if (event.key === 'ArrowDown' && event.altKey) {
                            event.preventDefault();
                            overlay.open();
                        }
                    }
                })
            ),
            h(
                'button',
                mergeAttrs({ key: 'dropdown', type: 'button' }, part('dropdown'), {
                    disabled: current.disabled,
                    'aria-label': locale().aria.chooseDate,
                    'aria-haspopup': 'dialog',
                    'aria-expanded': open ? 'true' : 'false',
                    'aria-controls': open ? dialogId : undefined,
                    ref: (el: Element | null) => (button = el as HTMLButtonElement | null),
                    onClick: () => overlay.toggle()
                }),
                iconView('calendar')
            )
        ]);
    }

    render();

    return {
        element,
        update(next) {
            current = { ...current, ...next };
            if ('value' in next) {
                value = normalizeDateRange(next.value ?? none());
                text = written(value);
            }
            render();
            overlay.update();
        },
        value: () => ({ ...value }),
        open: () => overlay.open(),
        close: () => overlay.close('request'),
        focus: () => (input ?? button)?.focus(),
        destroy() {
            overlay.destroy();
            root.clear();
        }
    };
}

const iconView = (name: string): Child => iconNode(getIcon(name));

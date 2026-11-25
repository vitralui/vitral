import {
    addMonths,
    calendarKeyTarget,
    en,
    formatDate,
    isDateSelectable,
    isSameDay,
    loadStyle,
    monthGrid,
    parseDate,
    startOfDay,
    weekdayOrder,
    type CalendarDay,
    type ClassEntry,
    type DateConstraints,
    type Locale
} from '@vitral/core';
import { createRoot, h, iconNode, mergeAttrs, partResolver, type Child, type PassThrough, type VElement } from '@vitral/dom';
import { getIcon } from '@vitral/icons';
import { baseStyle, buttonStyle, datepickerStyle } from '@vitral/styles';
import { createOverlay, type OverlayTarget } from './overlay';

/**
 * A date field with no framework in it: a text box that takes a date typed in
 * the locale's format, and a button that opens a month to pick one from. It
 * is drawn with the classes the Vue DatePicker wears, so the two look the
 * same, and it follows the WAI-ARIA date picker dialog: arrows by day and
 * week, Home and End to the ends of the week, Page Up and Page Down by month
 * (and, with Shift, by year), Enter to choose, Escape to close.
 */

export interface DatePickerConfig {
    value?: Date | null;
    min?: Date | null;
    max?: Date | null;
    /** How a date is written and read; the locale's `dateFormat` by default. */
    dateFormat?: string;
    placeholder?: string;
    disabled?: boolean;
    size?: 'small' | 'large';
    fluid?: boolean;
    invalid?: boolean;
    /** Today and Clear under the month. On by default. */
    showButtonBar?: boolean;
    ariaLabel?: string;
    ariaLabelledby?: string;
    /** Prefix of the ids it gives its elements; generated when unset. */
    id?: string;
    locale?: Locale;
    unstyled?: boolean;
    classes?: Partial<Record<string, ClassEntry>>;
    pt?: PassThrough;
    /** Where the month is put; the nearest overlay scope by default. */
    overlayTarget?: OverlayTarget;
    zIndex?: number;
    nonce?: string;
    cssLayer?: string | false;
    /** A date chosen, typed or cleared (null). */
    onChange?: (value: Date | null) => void;
    /** Extra attributes for the text box, such as `data-*` hooks. */
    inputAttrs?: Record<string, unknown>;
}

export interface DatePickerHandle {
    update(config: Partial<DatePickerConfig>): void;
    /** The date as it stands. */
    value(): Date | null;
    open(): void;
    close(): void;
    focus(): void;
    destroy(): void;
    readonly element: HTMLElement;
}

let counter = 0;

export function createDatePicker(element: HTMLElement, config: DatePickerConfig = {}): DatePickerHandle {
    let current: DatePickerConfig = { ...config };
    let value: Date | null = config.value ?? null;
    let text = '';
    /** The day the keyboard is on, and so the month on show. */
    let active = startOfDay(value ?? new Date());
    let input: HTMLInputElement | null = null;
    let button: HTMLButtonElement | null = null;

    const id = config.id ?? `vt-datepicker-${++counter}`;
    const dialogId = `${id}-dialog`;
    const titleId = `${id}-title`;
    const root = createRoot(element);
    const locale = (): Locale => current.locale ?? en;
    const pattern = () => current.dateFormat ?? locale().dateFormat;
    const constraints = (): DateConstraints => ({ min: current.min, max: current.max });
    const part = partResolver({
        style: datepickerStyle,
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
        loadStyle(datepickerStyle.name, datepickerStyle.css, options);
    }

    const written = (date: Date | null) => (date ? formatDate(date, pattern(), locale()) : '');
    text = written(value);

    function choose(date: Date | null, close = true) {
        const changed = !isSameDay(date, value) || (date === null) !== (value === null);
        value = date ? startOfDay(date) : null;
        text = written(value);
        if (value) active = value;
        if (close) overlay.close('request');
        render();
        if (close) input?.focus();
        if (changed) current.onChange?.(value);
    }

    /**
     * What is being typed, read as it is typed: once it is a whole date (or
     * nothing) it is the value, so a form or a grid that reads the value on
     * Enter or Tab, before the box is left, has it.
     */
    function onTyped(typed: string) {
        text = typed;
        const parsed = typed.trim() ? parseDate(typed.trim(), pattern()) : null;
        if (typed.trim() && !(parsed && isDateSelectable(parsed, constraints()))) return;
        const next = parsed ? startOfDay(parsed) : null;
        if (isSameDay(next, value) && (next === null) === (value === null)) return;
        value = next;
        if (value) active = value;
        current.onChange?.(value);
    }

    /** What was typed, read when the box is left or Enter is pressed: a date, nothing, or put back as it was. */
    function commitText() {
        const typed = text.trim();
        if (!typed) return choose(null, false);
        const parsed = parseDate(typed, pattern());
        if (parsed && isDateSelectable(parsed, constraints())) return choose(parsed, false);
        text = written(value);
        render();
    }

    // ---- the month ------------------------------------------------------------------------

    const overlay = createOverlay({
        anchor: () => element,
        render: () => panelView(),
        placement: 'bottom-start',
        target: () => current.overlayTarget,
        zIndex: current.zIndex,
        inside: () => [element, overlay.element()],
        onOpen: () => {
            active = startOfDay(value ?? new Date());
            overlay.update();
            render();
            focusActive();
        },
        onClose: () => render()
    });

    function focusActive() {
        const panel = overlay.element();
        const day = panel?.querySelector<HTMLElement>(`[data-date="${key(active)}"]`);
        day?.focus();
    }

    const key = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

    function move(to: Date) {
        active = startOfDay(to);
        overlay.update();
        focusActive();
    }

    function onGridKeydown(event: KeyboardEvent) {
        if (current.disabled) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (isDateSelectable(active, constraints())) choose(active);
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
        const weeks = monthGrid(active.getFullYear(), active.getMonth(), words.firstDayOfWeek, today);
        const title = `${words.monthNames[active.getMonth()]} ${active.getFullYear()}`;
        const page = (step: 1 | -1) => () => move(addMonths(active, step));
        const dayView = (day: CalendarDay) => {
            const selectable = isDateSelectable(day.date, constraints());
            const selected = isSameDay(day.date, value);
            return h(
                'td',
                mergeAttrs({ key: key(day.date) }, part('day', { selected, today: day.today, otherMonth: day.otherMonth, disabled: !selectable }), {
                    tabindex: isSameDay(day.date, active) ? 0 : -1,
                    'data-date': key(day.date),
                    'aria-selected': selected ? 'true' : 'false',
                    'aria-current': day.today ? 'date' : undefined,
                    'aria-disabled': selectable ? undefined : 'true',
                    'aria-label': formatDate(day.date, 'd MMMM yyyy', words),
                    onClick: () => selectable && choose(day.date)
                }),
                h('span', part('dayLabel'), String(day.day))
            );
        };
        // The month's arrows: small text buttons with only an icon, as the Vue DatePicker draws them.
        const pageButton = (name: string, own: Record<string, unknown>, label: string, icon: string, onClick: () => void) =>
            h(
                'button',
                mergeAttrs({ key: name, type: 'button' }, buttonPart('root', { variant: 'text', severity: 'secondary', size: 'small', iconOnly: true }), own, { 'aria-label': label, onClick }),
                h('span', buttonPart('icon'), iconView(icon))
            );
        const footerButton = (label: string, onClick: () => void, severity?: 'secondary', disabled?: boolean) =>
            h(
                'button',
                mergeAttrs({ key: label, type: 'button' }, buttonPart('root', { variant: 'text', size: 'small', severity }), { disabled, onClick }),
                h('span', buttonPart('label'), label)
            );
        return h(
            'div',
            mergeAttrs({ key: 'panel' }, part('panel', {}), { id: dialogId, role: 'dialog', 'aria-modal': 'true', 'aria-label': words.aria.chooseDate }),
            h(
                'div',
                part('header'),
                h('div', mergeAttrs({ key: 'title' }, part('title'), { id: titleId, 'aria-live': 'polite', 'aria-atomic': 'true' }), h('span', part('titleText'), title)),
                pageButton('prev', part('prevButton'), words.aria.previousMonth, 'chevronLeft', page(-1)),
                pageButton('next', part('nextButton'), words.aria.nextMonth, 'chevronRight', page(1))
            ),
            h(
                'table',
                mergeAttrs({ key: 'grid' }, part('grid'), { role: 'grid', 'aria-labelledby': titleId, onKeydown: onGridKeydown }),
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
            ),
            current.showButtonBar === false
                ? null
                : h(
                      'div',
                      mergeAttrs({ key: 'footer' }, part('footer')),
                      footerButton(words.today, () => choose(today), undefined, !isDateSelectable(today, constraints())),
                      footerButton(words.clear, () => choose(null), 'secondary')
                  )
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
                    placeholder: current.placeholder ?? pattern().toLowerCase(),
                    disabled: current.disabled,
                    'aria-label': current.ariaLabel,
                    'aria-labelledby': current.ariaLabelledby,
                    'aria-invalid': current.invalid ? 'true' : undefined,
                    ref: (el: Element | null) => (input = el as HTMLInputElement | null),
                    onInput: (event: Event) => onTyped((event.target as HTMLInputElement).value),
                    onBlur: commitText,
                    onKeydown: (event: KeyboardEvent) => {
                        // Enter is left to go on to whatever holds the field (a form, a grid's editor), with the value already read.
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
                value = next.value ?? null;
                text = written(value);
            }
            render();
            overlay.update();
        },
        value: () => value,
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

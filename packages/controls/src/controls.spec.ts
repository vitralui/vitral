import { ptBR } from '@vitral/core';
import { h } from '@vitral/dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { createMenu, type MenuHandle } from './menu';
import { createOverlay, type Overlay } from './overlay';
import { createDatePicker } from './datepicker';
import { createDateRange } from './daterange';
import { createSelect, type SelectHandle } from './select';

const key = (target: Element | Document, k: string, options: KeyboardEventInit = {}) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...options }));

let open: { destroy(): void }[] = [];
const track = <T extends { destroy(): void }>(thing: T): T => (open.push(thing), thing);

afterEach(() => {
    open.forEach((thing) => thing.destroy());
    open = [];
    document.body.innerHTML = '';
});

function anchorButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = 'Open';
    document.body.appendChild(button);
    return button;
}

describe('a panel that hangs from something', () => {
    function mount(options: Record<string, unknown> = {}) {
        const button = anchorButton();
        const overlay: Overlay = track(
            createOverlay({
                anchor: () => button,
                render: () => h('div', { class: 'panel', role: 'group', 'aria-label': 'Panel' }, h('button', { type: 'button' }, 'Inside')) as never,
                ...options
            })
        );
        return { button, overlay, panel: () => document.querySelector<HTMLElement>('.panel') };
    }

    it('is nowhere until it is opened, and goes in the overlay host', () => {
        const { overlay, panel } = mount();
        expect(panel()).toBeNull();
        overlay.open();
        expect(panel()!.parentElement).toBe(document.body);
        expect(overlay.isOpen).toBe(true);
    });

    it('closes on Escape, with the keyboard back on what opened it', () => {
        const closed = vi.fn();
        const { button, overlay, panel } = mount({ onClose: closed });
        button.focus();
        overlay.open();
        key(document, 'Escape');
        expect(panel()).toBeNull();
        expect(document.activeElement).toBe(button);
        expect(closed).toHaveBeenCalledWith('escape');
    });

    it('closes on a press outside it, and stays open for one inside', () => {
        const { overlay, panel } = mount();
        overlay.open();
        panel()!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        expect(panel()).not.toBeNull();
        document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        expect(panel()).toBeNull();
    });

    it('draws again while it is open, keeping the element it is in', () => {
        let label = 'One';
        const button = anchorButton();
        const overlay = track(
            createOverlay({
                anchor: () => button,
                render: () => h('div', { class: 'panel' }, label) as never
            })
        );
        overlay.open();
        const first = document.querySelector('.panel');
        label = 'Two';
        overlay.update();
        expect(document.querySelector('.panel')).toBe(first);
        expect(first!.textContent).toBe('Two');
    });

    it('takes its panel with it when it goes', () => {
        const { overlay, panel } = mount();
        overlay.open();
        overlay.destroy();
        expect(panel()).toBeNull();
    });

    it('only the topmost layer hears Escape', () => {
        const panels = () => document.querySelectorAll('.panel').length;
        const outer = mount();
        outer.overlay.open();
        const inner = mount();
        inner.overlay.open();
        expect(panels()).toBe(2);
        key(document, 'Escape');
        // The one opened last is the one that hears it.
        expect(panels()).toBe(1);
        expect(inner.overlay.isOpen).toBe(false);
        expect(outer.overlay.isOpen).toBe(true);
        key(document, 'Escape');
        expect(panels()).toBe(0);
    });
});

describe('a select with no framework in it', () => {
    const options = [
        { label: 'Lisbon', value: 'lis' },
        { label: 'Porto', value: 'opo' },
        { label: 'Faro', value: 'fao', disabled: true },
        { label: 'Braga', value: 'bgz' }
    ];

    function mount(config: Record<string, unknown> = {}) {
        const element = document.createElement('div');
        document.body.appendChild(element);
        const select: SelectHandle = track(createSelect(element, { options, optionValue: 'value', ariaLabel: 'City', ...config }));
        return {
            element,
            select,
            trigger: () => element.querySelector<HTMLButtonElement>('[role="combobox"]')!,
            list: () => document.querySelector<HTMLElement>('[role="listbox"]'),
            items: () => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'))
        };
    }

    it('is a combobox that says what is chosen', () => {
        const { trigger } = mount({ value: 'opo' });
        expect(trigger().getAttribute('role')).toBe('combobox');
        expect(trigger().getAttribute('aria-haspopup')).toBe('listbox');
        expect(trigger().getAttribute('aria-expanded')).toBe('false');
        expect(trigger().textContent).toBe('Porto');
    });

    it('says its placeholder when nothing is chosen', () => {
        const { trigger } = mount({ placeholder: 'Pick one' });
        expect(trigger().textContent).toBe('Pick one');
    });

    it('opens a listbox of its options, marking the one in hand', () => {
        const { trigger, list, items, select } = mount({ value: 'opo' });
        select.open();
        expect(list()!.getAttribute('aria-label')).toBe('City');
        expect(items().map((item) => item.textContent)).toEqual(['Lisbon', 'Porto', 'Faro', 'Braga']);
        expect(items()[1]!.getAttribute('aria-selected')).toBe('true');
        expect(items()[2]!.getAttribute('aria-disabled')).toBe('true');
        // The combobox keeps the keyboard and points at the option in hand.
        expect(trigger().getAttribute('aria-expanded')).toBe('true');
        expect(trigger().getAttribute('aria-activedescendant')).toBe(items()[1]!.id);
    });

    it('walks the options with the arrows, stepping over what is disabled', () => {
        const { trigger, items, select } = mount({ value: 'opo' });
        select.open();
        key(trigger(), 'ArrowDown');
        expect(trigger().getAttribute('aria-activedescendant')).toBe(items()[3]!.id);
        key(trigger(), 'ArrowUp');
        expect(trigger().getAttribute('aria-activedescendant')).toBe(items()[1]!.id);
        key(trigger(), 'Home');
        expect(trigger().getAttribute('aria-activedescendant')).toBe(items()[0]!.id);
        key(trigger(), 'End');
        expect(trigger().getAttribute('aria-activedescendant')).toBe(items()[3]!.id);
    });

    it('chooses with Enter, and says so once', () => {
        const changed = vi.fn();
        const { trigger, list, select } = mount({ value: 'lis', onChange: changed });
        select.open();
        key(trigger(), 'ArrowDown');
        key(trigger(), 'Enter');
        expect(changed).toHaveBeenCalledTimes(1);
        expect(changed.mock.calls[0]![0]).toBe('opo');
        expect(select.value()).toBe('opo');
        expect(trigger().textContent).toBe('Porto');
        // Choosing puts the list away and the keyboard back on the combobox.
        expect(list()).toBeNull();
        expect(document.activeElement).toBe(trigger());
    });

    it('chooses with a press', () => {
        const changed = vi.fn();
        const { items, select } = mount({ onChange: changed });
        select.open();
        items()[3]!.click();
        expect(changed).toHaveBeenCalledWith('bgz', expect.objectContaining({ label: 'Braga' }));
    });

    it('leaves a disabled option alone', () => {
        const changed = vi.fn();
        const { items, select } = mount({ onChange: changed });
        select.open();
        items()[2]!.click();
        expect(changed).not.toHaveBeenCalled();
        expect(select.value()).toBeUndefined();
    });

    it('finds an option by typing, open or shut', () => {
        const changed = vi.fn();
        const { trigger, select } = mount({ onChange: changed });
        // Shut, typing chooses outright.
        key(trigger(), 'b');
        expect(select.value()).toBe('bgz');
        // Open, it moves what is in hand.
        select.open();
        key(trigger(), 'l');
        expect(trigger().getAttribute('aria-activedescendant')).toMatch(/option-0$/);
    });

    it('takes bare values as their own label', () => {
        const { trigger, items, select } = mount({ options: [8, 16, 32], value: 16 });
        expect(trigger().textContent).toBe('16');
        select.open();
        expect(items().map((item) => item.textContent)).toEqual(['8', '16', '32']);
    });

    it('speaks the locale it is given', () => {
        const { list, select } = mount({ options: [], locale: ptBR });
        select.open();
        expect(list()).toBeNull();
        expect(document.querySelector('[role="status"]')?.textContent).toBe('Nenhuma opção disponível');
    });

    it('takes a new value from the outside', () => {
        const { trigger, select } = mount({ value: 'lis' });
        select.update({ value: 'bgz' });
        expect(trigger().textContent).toBe('Braga');
    });

    it('has nothing axe objects to, open or shut', async () => {
        const { select } = mount({ value: 'opo' });
        await expectNoA11yViolations(document.body);
        select.open();
        await expectNoA11yViolations(document.body);
    });

    it('clears up after itself', () => {
        const { element, select, list } = mount();
        select.open();
        select.destroy();
        expect(list()).toBeNull();
        expect(element.children).toHaveLength(0);
    });
});

describe('a menu of commands', () => {
    const chosen = vi.fn();
    const items = [
        { label: 'Download SVG', icon: 'download', onSelect: () => chosen('svg') },
        { label: 'Download PNG', onSelect: () => chosen('png') },
        { separator: true },
        { label: 'Print', disabled: true, onSelect: () => chosen('print') }
    ];

    function mount(config: Record<string, unknown> = {}) {
        const button = anchorButton();
        const menu: MenuHandle = track(createMenu({ items, ariaLabel: 'Export', ...config }));
        return {
            button,
            menu,
            panel: () => document.querySelector<HTMLElement>('[role="menu"]'),
            commands: () => Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'))
        };
    }

    it('opens under its button with the keyboard on the first command', () => {
        const { button, menu, panel, commands } = mount();
        menu.open(button);
        expect(panel()!.getAttribute('aria-label')).toBe('Export');
        expect(commands().map((item) => item.textContent)).toEqual(['Download SVG', 'Download PNG', 'Print']);
        expect(document.activeElement).toBe(commands()[0]);
        expect(document.querySelectorAll('[role="separator"]')).toHaveLength(1);
    });

    it('walks with the arrows, around the ends and over what is disabled', () => {
        const { button, menu, commands } = mount();
        menu.open(button);
        key(commands()[0]!, 'ArrowDown');
        expect(document.activeElement).toBe(commands()[1]);
        // Print is disabled and the separator is not a command: it comes back round.
        key(commands()[1]!, 'ArrowDown');
        expect(document.activeElement).toBe(commands()[0]);
        key(commands()[0]!, 'ArrowUp');
        expect(document.activeElement).toBe(commands()[1]);
    });

    it('runs a command and puts itself away', () => {
        chosen.mockClear();
        const { button, menu, commands, panel } = mount();
        menu.open(button);
        key(commands()[0]!, 'Enter');
        expect(chosen).toHaveBeenCalledWith('svg');
        expect(panel()).toBeNull();
        expect(document.activeElement).toBe(button);
    });

    it('closes on Escape without running anything', () => {
        chosen.mockClear();
        const { button, menu, panel } = mount();
        menu.open(button);
        key(document, 'Escape');
        expect(panel()).toBeNull();
        expect(chosen).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(button);
    });

    it('opens on the last command when asked', () => {
        const { button, menu, commands } = mount();
        menu.open(button, { focusLast: true });
        // The last one is disabled, so the keyboard stops on the one before it.
        expect(document.activeElement).toBe(commands()[1]);
    });

    it('toggles from the same button', () => {
        const { button, menu, panel } = mount();
        menu.toggle(button);
        expect(panel()).not.toBeNull();
        menu.toggle(button);
        expect(panel()).toBeNull();
    });

    it('has nothing axe objects to', async () => {
        const { button, menu } = mount();
        menu.open(button);
        await expectNoA11yViolations(document.body);
    });
});

describe('a date field', () => {
    function mount(options: Record<string, unknown> = {}) {
        const host = document.createElement('span');
        document.body.appendChild(host);
        const onChange = vi.fn();
        const picker = track(createDatePicker(host, { locale: ptBR, ariaLabel: 'Entrega', onChange, ...options }));
        const input = () => host.querySelector('input') as HTMLInputElement;
        const type = (text: string) => {
            input().value = text;
            input().dispatchEvent(new Event('input', { bubbles: true }));
        };
        return { host, picker, input, type, onChange, panel: () => document.querySelector('.vt-datepicker-panel') as HTMLElement | null };
    }

    it('reads a date typed in the locale’s format as soon as it is whole, and writes it back the same way', () => {
        const { input, type, onChange, picker } = mount({ value: new Date(2026, 2, 5) });
        expect(input().value).toBe('05/03/2026');
        type('20/03/20');
        expect(onChange).not.toHaveBeenCalled();
        type('20/03/2026');
        expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 2, 20));
        type('');
        expect(onChange).toHaveBeenLastCalledWith(null);
        // Something that is no date is put back when the box is left.
        type('31/02/2026');
        input().dispatchEvent(new Event('blur'));
        expect(input().value).toBe('');
        expect(picker.value()).toBeNull();
    });

    it('opens a month on the date, moves by the keyboard, and chooses with Enter', () => {
        const { host, panel, onChange, input } = mount({ value: new Date(2026, 2, 5) });
        (host.querySelector('.vt-datepicker-dropdown') as HTMLButtonElement).click();
        expect(panel()!.getAttribute('role')).toBe('dialog');
        expect(panel()!.querySelector('.vt-datepicker-title')!.textContent).toBe('março 2026');
        expect(document.activeElement!.getAttribute('data-date')).toBe('2026-3-5');
        key(document.activeElement!, 'ArrowDown');
        key(document.activeElement!, 'PageDown');
        expect(document.activeElement!.getAttribute('data-date')).toBe('2026-4-12');
        expect(panel()!.querySelector('.vt-datepicker-title')!.textContent).toBe('abril 2026');
        key(document.activeElement!, 'Enter');
        expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 3, 12));
        expect(panel()).toBeNull();
        expect(input().value).toBe('12/04/2026');
        expect(document.activeElement).toBe(input());
    });

    it('keeps to its limits, and has Today and Clear', () => {
        const { host, panel, onChange } = mount({ value: new Date(2026, 2, 5), min: new Date(2026, 2, 3) });
        (host.querySelector('.vt-datepicker-dropdown') as HTMLButtonElement).click();
        const day = (date: string) => panel()!.querySelector(`[data-date="${date}"]`) as HTMLElement;
        expect(day('2026-3-2').getAttribute('aria-disabled')).toBe('true');
        day('2026-3-2').click();
        expect(onChange).not.toHaveBeenCalled();
        const [, clear] = Array.from(panel()!.querySelectorAll('.vt-datepicker-footer button')) as HTMLButtonElement[];
        expect(clear!.textContent).toBe('Limpar');
        clear!.click();
        expect(onChange).toHaveBeenLastCalledWith(null);
    });

    it('has nothing axe objects to, open', async () => {
        const { host, panel } = mount({ value: new Date(2026, 2, 5) });
        (host.querySelector('.vt-datepicker-dropdown') as HTMLButtonElement).click();
        await expectNoA11yViolations(host);
        await expectNoA11yViolations(panel()!);
    });
});

describe('a range field', () => {
    function mount(options: Record<string, unknown> = {}) {
        const host = document.createElement('span');
        document.body.appendChild(host);
        const onChange = vi.fn();
        const field = track(createDateRange(host, { locale: ptBR, ariaLabel: 'Estadia', onChange, ...options }));
        const input = () => host.querySelector('input') as HTMLInputElement;
        const type = (text: string) => {
            input().value = text;
            input().dispatchEvent(new Event('input', { bubbles: true }));
        };
        const panel = () => document.querySelector('.vt-daterange-panel') as HTMLElement | null;
        const day = (date: string) => panel()!.querySelector(`[data-date="${date}"]:not([data-blank])`) as HTMLElement;
        return { host, field, input, type, onChange, panel, day };
    }

    it('takes a span typed in the locale’s format, either way round, and writes it with its separator', () => {
        const { input, type, onChange, field } = mount();
        type('20/03/2026 - 05/03/2026');
        expect(onChange).toHaveBeenLastCalledWith({ start: new Date(2026, 2, 5), end: new Date(2026, 2, 20) });
        input().dispatchEvent(new Event('blur'));
        expect(input().value).toBe('05/03/2026 – 20/03/2026');
        // A start alone, the end still to come.
        type('05/03/2026');
        expect(onChange).toHaveBeenLastCalledWith({ start: new Date(2026, 2, 5), end: null });
        // Something that is no span is put back when the box is left.
        type('05/03/2026 - 31/02/2026');
        input().dispatchEvent(new Event('blur'));
        expect(input().value).toBe('05/03/2026');
        expect(field.value()).toEqual({ start: new Date(2026, 2, 5), end: null });
    });

    it('opens two months, starts with one press and ends with the next, showing the span as it is chosen', () => {
        const { host, panel, day, onChange, input } = mount({ value: { start: new Date(2026, 2, 5), end: new Date(2026, 2, 9) } });
        (host.querySelector('.vt-daterange-dropdown') as HTMLButtonElement).click();
        expect(Array.from(panel()!.querySelectorAll('.vt-daterange-title'), (t) => t.textContent)).toEqual(['março 2026', 'abril 2026']);
        expect(day('2026-3-7').className).toContain('vt-daterange-day-in-range');
        day('2026-4-2').click();
        expect(onChange).toHaveBeenLastCalledWith({ start: new Date(2026, 3, 2), end: null });
        // Under the pointer, the day stands for the end: the span shows before it is chosen.
        day('2026-3-28').dispatchEvent(new MouseEvent('mouseenter'));
        expect(day('2026-3-30').className).toContain('vt-daterange-day-in-range');
        expect(day('2026-3-30').className).toContain('vt-daterange-day-preview');
        day('2026-3-28').click();
        expect(onChange).toHaveBeenLastCalledWith({ start: new Date(2026, 2, 28), end: new Date(2026, 3, 2) });
        expect(panel()).toBeNull();
        expect(input().value).toBe('28/03/2026 – 02/04/2026');
        expect(document.activeElement).toBe(input());
    });

    it('chooses by the keyboard and keeps to its limits', () => {
        const { host, panel, day, onChange } = mount({ value: { start: new Date(2026, 2, 5), end: null }, min: new Date(2026, 2, 3), months: 1 });
        (host.querySelector('.vt-daterange-dropdown') as HTMLButtonElement).click();
        expect(panel()!.querySelectorAll('.vt-daterange-month').length).toBe(1);
        expect(document.activeElement!.getAttribute('data-date')).toBe('2026-3-5');
        day('2026-3-2').click();
        expect(onChange).not.toHaveBeenCalled();
        key(document.activeElement!, 'ArrowDown');
        // The keyboard's day previews the end too.
        expect(day('2026-3-8').className).toContain('vt-daterange-day-in-range');
        key(document.activeElement!, 'Enter');
        expect(onChange).toHaveBeenLastCalledWith({ start: new Date(2026, 2, 5), end: new Date(2026, 2, 12) });
    });

    it('has nothing axe objects to, open', async () => {
        const { host, panel } = mount({ value: { start: new Date(2026, 2, 5), end: new Date(2026, 2, 9) }, showClearButton: true });
        (host.querySelector('.vt-daterange-dropdown') as HTMLButtonElement).click();
        await expectNoA11yViolations(host);
        await expectNoA11yViolations(panel()!);
    });
});

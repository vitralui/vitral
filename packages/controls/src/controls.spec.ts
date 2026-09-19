import { ptBR } from '@vitral/core';
import { h } from '@vitral/dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { createMenu, type MenuHandle } from './menu';
import { createOverlay, type Overlay } from './overlay';
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

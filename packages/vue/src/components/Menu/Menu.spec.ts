import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Menu from './Menu.vue';
import type { MenuItem } from './types';

function model(onCommand = vi.fn()): MenuItem[] {
    return [
        {
            label: 'Documents',
            items: [
                { label: 'New', icon: 'plus', command: onCommand },
                { label: 'Search', icon: 'search', command: onCommand }
            ]
        },
        { separator: true },
        {
            label: 'Profile',
            items: [
                { label: 'Settings', icon: 'sliders', command: onCommand },
                { label: 'Hidden', visible: false },
                { label: 'Sign out', disabled: true, command: onCommand },
                { label: 'Help', url: '#help' }
            ]
        }
    ];
}

const menuitems = () => Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
const menu = () => document.querySelector<HTMLElement>('[role="menu"]');

describe('Menu', () => {
    it('is a named menu of menuitems, grouped under labelled groups', () => {
        mountVt(Menu, { props: { model: model(), ariaLabel: 'Account' } });
        expect(menu()!.getAttribute('aria-label')).toBe('Account');
        expect(menuitems().map((i) => i.textContent?.trim())).toEqual(['New', 'Search', 'Settings', 'Sign out', 'Help']);
        const groups = document.querySelectorAll('[role="group"]');
        expect(groups).toHaveLength(2);
        expect(document.getElementById(groups[1]!.getAttribute('aria-labelledby')!)?.textContent?.trim()).toBe('Profile');
        expect(document.querySelectorAll('[role="separator"]')).toHaveLength(1);
        expect(menuitems()[3]!.getAttribute('aria-disabled')).toBe('true');
    });

    it('renders an item with a url as a link menuitem', () => {
        mountVt(Menu, { props: { model: model(), ariaLabel: 'Account' } });
        const help = menuitems()[4]!;
        expect(help.tagName).toBe('A');
        expect(help.getAttribute('href')).toBe('#help');
    });

    it('keeps one item in the tab order and moves focus with the arrows (wrapping), Home and End', async () => {
        mountVt(Menu, { props: { model: model(), ariaLabel: 'Account' } });
        const items = menuitems();
        expect(items.map((i) => i.tabIndex)).toEqual([0, -1, -1, -1, -1]);
        items[0]!.focus();
        await press(items[0]!, 'ArrowDown');
        expect(document.activeElement).toBe(items[1]);
        expect(items[1]!.tabIndex).toBe(0);
        expect(items[0]!.tabIndex).toBe(-1);
        await press(items[1]!, 'ArrowUp');
        await press(items[0]!, 'ArrowUp');
        expect(document.activeElement).toBe(items[4]);
        await press(items[4]!, 'ArrowDown');
        expect(document.activeElement).toBe(items[0]);
        await press(items[0]!, 'End');
        expect(document.activeElement).toBe(items[4]);
        await press(items[4]!, 'Home');
        expect(document.activeElement).toBe(items[0]);
    });

    it('jumps by typeahead', async () => {
        mountVt(Menu, { props: { model: model(), ariaLabel: 'Account' } });
        const items = menuitems();
        items[0]!.focus();
        await press(items[0]!, 's');
        expect(document.activeElement).toBe(items[1]);
        await press(items[1]!, 's');
        expect(document.activeElement).toBe(items[2]);
    });

    it('runs the command on Enter, Space and click — but not for a disabled item', async () => {
        const onCommand = vi.fn();
        mountVt(Menu, { props: { model: model(onCommand), ariaLabel: 'Account' } });
        const items = menuitems();
        items[0]!.focus();
        await press(items[0]!, 'Enter');
        expect(onCommand).toHaveBeenCalledTimes(1);
        expect(onCommand.mock.calls[0]![0]).toMatchObject({ item: { label: 'New' } });
        expect(onCommand.mock.calls[0]![0].originalEvent).toBeInstanceOf(Event);
        await press(items[0]!, ' ');
        expect(onCommand).toHaveBeenCalledTimes(2);
        items[2]!.click();
        expect(onCommand).toHaveBeenCalledTimes(3);
        items[3]!.focus();
        await press(items[3]!, 'Enter');
        expect(onCommand).toHaveBeenCalledTimes(3);
    });

    function mountPopup(onCommand = vi.fn()) {
        const menuRef = ref<InstanceType<typeof Menu> | null>(null);
        const wrapper = mountVt(
            defineComponent(() => () => [
                h('button', { type: 'button', id: 'trigger', 'aria-haspopup': 'menu', onClick: (e: Event) => menuRef.value?.toggle(e) }, 'Options'),
                h(Menu, { ref: menuRef, popup: true, model: model(onCommand) })
            ])
        );
        const trigger = () => document.getElementById('trigger') as HTMLButtonElement;
        const open = async () => {
            trigger().click();
            await nextTick();
            await nextTick();
        };
        return { wrapper, trigger, open, menuRef };
    }

    it('in popup mode, opens from its trigger with focus on the first item, named by the trigger', async () => {
        const { trigger, open, wrapper } = mountPopup();
        expect(menu()).toBeNull();
        await open();
        expect(menu()).not.toBeNull();
        expect(menu()!.closest('[data-v-app]')).toBeNull();
        expect(document.activeElement).toBe(menuitems()[0]);
        expect(menu()!.getAttribute('aria-labelledby')).toBe('trigger');
        expect(trigger().getAttribute('aria-expanded')).toBe('true');
        expect(wrapper.findComponent(Menu).emitted('show')).toHaveLength(1);
    });

    it('closes on Escape and hands focus back to the trigger', async () => {
        const { trigger, open } = mountPopup();
        await open();
        await press(menuitems()[0]!, 'Escape');
        expect(menu()).toBeNull();
        expect(document.activeElement).toBe(trigger());
        expect(trigger().getAttribute('aria-expanded')).toBe('false');
    });

    it('closes on Tab, on activation and on a press outside', async () => {
        const onCommand = vi.fn();
        const { trigger, open } = mountPopup(onCommand);
        await open();
        await press(menuitems()[0]!, 'Tab');
        expect(menu()).toBeNull();
        expect(document.activeElement).toBe(trigger());

        await open();
        await press(menuitems()[0]!, 'ArrowDown');
        await press(menuitems()[1]!, 'Enter');
        expect(onCommand).toHaveBeenCalledTimes(1);
        expect(menu()).toBeNull();
        expect(document.activeElement).toBe(trigger());

        await open();
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await nextTick();
        expect(menu()).toBeNull();
    });

    it('has no accessibility violations, inline and as a popup closed and open', async () => {
        mountVt(Menu, { props: { model: model(), ariaLabel: 'Account' } });
        const { open } = mountPopup();
        await expectNoA11yViolations();
        await open();
        await expectNoA11yViolations();
    });
});

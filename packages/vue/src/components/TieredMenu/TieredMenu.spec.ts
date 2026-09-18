import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import type { MenuItem } from '../Menu/types';
import TieredMenu from './TieredMenu.vue';

const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

function model(run = vi.fn()): MenuItem[] {
    return [
        {
            label: 'File',
            icon: 'file',
            items: [
                { label: 'New', items: [{ label: 'Document', command: run }, { label: 'Sheet', command: run }] },
                { label: 'Open', command: run },
                { separator: true },
                { label: 'Quit', disabled: true }
            ]
        },
        { label: 'Edit', items: [{ label: 'Cut', command: run }] },
        { label: 'Help', url: '#help' },
        { label: 'Hidden', visible: false }
    ];
}

const items = () => Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
const named = (label: string) => items().find((el) => el.textContent?.trim() === label)!;
const key = async (k: string) => {
    await press(document.activeElement!, k);
    await settle();
};

describe('TieredMenu', () => {
    it('is a named menu whose parents say they open a closed submenu', () => {
        mountVt(TieredMenu, { props: { model: model(), ariaLabel: 'Main' } });
        const menu = document.querySelector('[role="menu"]')!;
        expect(menu.getAttribute('aria-label')).toBe('Main');
        expect(items().map((i) => i.textContent?.trim())).toEqual(['File', 'Edit', 'Help']);
        expect(named('File').getAttribute('aria-haspopup')).toBe('menu');
        expect(named('File').getAttribute('aria-expanded')).toBe('false');
        expect(items().map((i) => i.tabIndex)).toEqual([0, -1, -1]);
        expect(named('Help').tagName).toBe('A');
    });

    it('opens submenus with Right and Enter, leaves them with Left and Escape, skipping separators and disabled items', async () => {
        mountVt(TieredMenu, { props: { model: model(), ariaLabel: 'Main' } });
        named('File').focus();
        await key('ArrowRight');
        expect(document.activeElement).toBe(named('New'));
        expect(named('File').getAttribute('aria-expanded')).toBe('true');
        const submenu = document.getElementById(named('File').getAttribute('aria-controls')!)!;
        expect(submenu.getAttribute('aria-labelledby')).toBe(named('File').id);
        await key('ArrowUp');
        expect(document.activeElement).toBe(named('Open'));
        await key('ArrowDown');
        expect(document.activeElement).toBe(named('New'));
        await key('Enter');
        expect(document.activeElement).toBe(named('Document'));
        await key('ArrowLeft');
        expect(document.activeElement).toBe(named('New'));
        await key('Escape');
        expect(document.activeElement).toBe(named('File'));
        expect(named('File').getAttribute('aria-expanded')).toBe('false');
    });

    it('runs a command with Enter and closes the submenus', async () => {
        const run = vi.fn();
        mountVt(TieredMenu, { props: { model: model(run), ariaLabel: 'Main' } });
        named('File').focus();
        await key('ArrowRight');
        await key('ArrowDown');
        await key('Enter');
        expect(run).toHaveBeenCalledTimes(1);
        expect(named('Open')).toBeUndefined();
    });

    it('jumps by typeahead within a level', async () => {
        mountVt(TieredMenu, { props: { model: model(), ariaLabel: 'Main' } });
        named('File').focus();
        await key('h');
        expect(document.activeElement).toBe(named('Help'));
    });

    it('opens submenus on hover', async () => {
        mountVt(TieredMenu, { props: { model: model(), ariaLabel: 'Main' } });
        named('Edit').dispatchEvent(new MouseEvent('mouseenter'));
        await nextTick();
        expect(named('Cut')).toBeDefined();
    });

    it('as a popup, opens on its first item and gives focus back on Escape', async () => {
        const menuRef = ref<InstanceType<typeof TieredMenu> | null>(null);
        mountVt(
            defineComponent(() => () => [
                h('button', { id: 'trigger', onClick: (e: Event) => menuRef.value?.toggle(e) }, 'Actions'),
                h(TieredMenu, { ref: menuRef, model: model(), popup: true })
            ])
        );
        const trigger = document.getElementById('trigger')!;
        trigger.focus();
        trigger.click();
        await settle();
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(document.querySelector('[role="menu"]')!.getAttribute('aria-labelledby')).toBe('trigger');
        expect(document.activeElement).toBe(named('File'));
        await key('ArrowRight');
        await key('Escape');
        expect(document.activeElement).toBe(named('File'));
        await key('Escape');
        await nextTick();
        expect(document.querySelector('[role="menu"]')).toBeNull();
        expect(document.activeElement).toBe(trigger);
    });

    it('has no accessibility violations, with a submenu open', async () => {
        mountVt(TieredMenu, { props: { model: model(), ariaLabel: 'Main' } });
        await expectNoA11yViolations();
        named('File').focus();
        await key('ArrowRight');
        await expectNoA11yViolations();
    });
});

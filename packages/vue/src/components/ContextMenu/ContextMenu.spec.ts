import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import type { MenuItem } from '../Menu/types';
import ContextMenu from './ContextMenu.vue';

const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

function mountContext(props: Record<string, unknown> = {}, run = vi.fn()) {
    const model: MenuItem[] = [
        { label: 'Rename', command: run },
        { label: 'Share', items: [{ label: 'Email', command: run }, { label: 'Link', command: run }] },
        { separator: true },
        { label: 'Delete', command: run }
    ];
    mountVt(
        defineComponent(() => () => [
            h('div', { id: 'file', tabindex: 0 }, 'report.pdf'),
            h(ContextMenu, { model, target: '#file', ariaLabel: 'File actions', ...props })
        ])
    );
    const file = () => document.getElementById('file')!;
    const menu = () => document.querySelector<HTMLElement>('[role="menu"]');
    const named = (label: string) => Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).find((el) => el.textContent?.trim() === label)!;
    return { file, menu, named, run };
}

describe('ContextMenu', () => {
    it('opens at the pointer on a right-click, with focus on the first item', async () => {
        const { file, menu, named } = mountContext();
        await settle();
        const event = new MouseEvent('contextmenu', { clientX: 40, clientY: 60, bubbles: true, cancelable: true });
        file().dispatchEvent(event);
        await settle();
        expect(event.defaultPrevented).toBe(true);
        expect(menu()!.getAttribute('aria-label')).toBe('File actions');
        const root = menu()!.parentElement!;
        expect(root.style.left).toBe('40px');
        expect(root.style.top).toBe('60px');
        expect(document.activeElement).toBe(named('Rename'));
    });

    it('opens from Shift+F10 on the target, and gives focus back on Escape', async () => {
        const { file, menu } = mountContext();
        await settle();
        file().focus();
        await press(file(), 'F10', { shiftKey: true });
        await settle();
        expect(menu()).not.toBeNull();
        await press(document.activeElement!, 'Escape');
        await nextTick();
        expect(menu()).toBeNull();
        expect(document.activeElement).toBe(file());
    });

    it('walks into submenus and runs a command, then closes', async () => {
        const run = vi.fn();
        const { file, menu, named } = mountContext({}, run);
        await settle();
        file().focus();
        await press(file(), 'ContextMenu');
        await settle();
        await press(document.activeElement!, 'ArrowDown');
        await settle();
        await press(document.activeElement!, 'ArrowRight');
        await settle();
        expect(document.activeElement).toBe(named('Email'));
        await press(document.activeElement!, 'Enter');
        await settle();
        expect(run).toHaveBeenCalledTimes(1);
        expect(menu()).toBeNull();
        expect(document.activeElement).toBe(file());
    });

    it('listens to the whole page when global, and closes on a press outside', async () => {
        const { menu } = mountContext({ target: null, global: true });
        await settle();
        document.body.dispatchEvent(new MouseEvent('contextmenu', { clientX: 5, clientY: 5, bubbles: true, cancelable: true }));
        await settle();
        expect(menu()).not.toBeNull();
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await nextTick();
        expect(menu()).toBeNull();
    });

    it('has no accessibility violations, closed or open', async () => {
        const { file } = mountContext();
        await settle();
        await expectNoA11yViolations();
        file().dispatchEvent(new MouseEvent('contextmenu', { clientX: 5, clientY: 5, bubbles: true }));
        await settle();
        await expectNoA11yViolations();
    });
});

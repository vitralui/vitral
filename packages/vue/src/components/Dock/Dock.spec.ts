import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Dock from './Dock.vue';

function mountDock(props: Record<string, unknown> = {}, run = vi.fn()) {
    mountVt(Dock, {
        props: {
            ariaLabel: 'Apps',
            model: [
                { label: 'Finder', icon: 'folder', command: run },
                { label: 'Mail', icon: 'bell', command: run, disabled: true },
                { label: 'Photos', icon: 'star', command: run },
                { label: 'Trash', icon: 'trash', url: '#trash' }
            ],
            ...props
        }
    });
    const items = () => Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    return { items, run };
}

describe('Dock', () => {
    it('is a horizontal menu of named items with one tab stop', () => {
        const { items } = mountDock();
        const menu = document.querySelector('[role="menu"]')!;
        expect(menu.getAttribute('aria-label')).toBe('Apps');
        expect(menu.getAttribute('aria-orientation')).toBe('horizontal');
        expect(items().map((i) => i.getAttribute('aria-label'))).toEqual(['Finder', 'Mail', 'Photos', 'Trash']);
        expect(items().map((i) => i.tabIndex)).toEqual([0, -1, -1, -1]);
        expect(items()[3]!.getAttribute('href')).toBe('#trash');
    });

    it('moves along the dock, wrapping and skipping disabled items, and runs an item', async () => {
        const { items, run } = mountDock();
        items()[0]!.focus();
        await press(items()[0]!, 'ArrowRight');
        expect(document.activeElement).toBe(items()[2]);
        await press(items()[2]!, 'End');
        expect(document.activeElement).toBe(items()[3]);
        await press(items()[3]!, 'ArrowRight');
        expect(document.activeElement).toBe(items()[0]);
        await press(items()[0]!, 'ArrowDown');
        expect(document.activeElement).toBe(items()[0]);
        await press(items()[0]!, 'Enter');
        expect(run).toHaveBeenCalledTimes(1);
        items()[1]!.click();
        expect(run).toHaveBeenCalledTimes(1);
    });

    it('runs vertically on a side, and grows the items near the pointer', async () => {
        const { items } = mountDock({ position: 'left' });
        expect(document.querySelector('[role="menu"]')!.getAttribute('aria-orientation')).toBe('vertical');
        items()[0]!.focus();
        await press(items()[0]!, 'ArrowDown');
        expect(document.activeElement).toBe(items()[2]);
        items()[2]!.parentElement!.dispatchEvent(new MouseEvent('mouseenter'));
        await nextTick();
        const li = document.querySelectorAll('li');
        expect(li[2]!.classList.contains('vt-dock-item-active')).toBe(true);
        expect(li[1]!.classList.contains('vt-dock-item-near')).toBe(true);
        expect(li[0]!.classList.contains('vt-dock-item-far')).toBe(true);
    });

    it('has no accessibility violations', async () => {
        mountDock();
        await expectNoA11yViolations();
    });
});

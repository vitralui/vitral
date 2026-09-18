import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import type { MenuItem } from '../Menu/types';
import Menubar from './Menubar.vue';

const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

function model(run = vi.fn()): MenuItem[] {
    return [
        { label: 'File', items: [{ label: 'New', command: run }, { label: 'Recent', items: [{ label: 'a.txt', command: run }] }] },
        { label: 'Edit', items: [{ label: 'Undo', command: run }, { label: 'Redo', command: run }] },
        { label: 'Help', command: run }
    ];
}

const items = () => Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
const named = (label: string) => items().find((el) => el.textContent?.trim() === label)!;
const key = async (k: string) => {
    await press(document.activeElement!, k);
    await settle();
};

describe('Menubar', () => {
    afterEach(() => vi.restoreAllMocks());

    it('is a horizontal menubar with one tab stop', () => {
        mountVt(Menubar, { props: { model: model(), ariaLabel: 'Application' } });
        const bar = document.querySelector('[role="menubar"]')!;
        expect(bar.getAttribute('aria-label')).toBe('Application');
        expect(bar.getAttribute('aria-orientation')).toBe('horizontal');
        expect(items().map((i) => i.tabIndex)).toEqual([0, -1, -1]);
        expect(named('File').getAttribute('aria-expanded')).toBe('false');
        expect(named('Help').hasAttribute('aria-haspopup')).toBe(false);
    });

    it('moves along the bar, opens menus with Down and Up, and moves between menus with the arrows', async () => {
        mountVt(Menubar, { props: { model: model(), ariaLabel: 'Application' } });
        named('File').focus();
        await key('ArrowRight');
        expect(document.activeElement).toBe(named('Edit'));
        await key('ArrowUp');
        expect(document.activeElement).toBe(named('Redo'));
        await key('ArrowLeft');
        expect(document.activeElement).toBe(named('File'));
        expect(named('File').getAttribute('aria-expanded')).toBe('true');
        expect(named('Edit').getAttribute('aria-expanded')).toBe('false');
        await key('ArrowDown');
        expect(document.activeElement).toBe(named('New'));
        await key('ArrowDown');
        await key('ArrowRight');
        expect(document.activeElement).toBe(named('a.txt'));
        await key('Escape');
        expect(document.activeElement).toBe(named('Recent'));
        await key('Escape');
        expect(document.activeElement).toBe(named('File'));
        expect(named('File').getAttribute('aria-expanded')).toBe('false');
        await key('ArrowLeft');
        expect(document.activeElement).toBe(named('Help'));
    });

    it('runs commands with Enter and closes its menus', async () => {
        const run = vi.fn();
        mountVt(Menubar, { props: { model: model(run), ariaLabel: 'Application' } });
        named('Edit').focus();
        await key('Enter');
        expect(document.activeElement).toBe(named('Undo'));
        await key('Enter');
        expect(run).toHaveBeenCalledTimes(1);
        expect(named('Undo')).toBeUndefined();
    });

    it('opens menus on click, then follows the pointer', async () => {
        mountVt(Menubar, { props: { model: model(), ariaLabel: 'Application' } });
        named('Edit').dispatchEvent(new MouseEvent('mouseenter'));
        await nextTick();
        expect(named('Undo')).toBeUndefined();
        named('File').click();
        await nextTick();
        expect(named('New')).toBeDefined();
        named('Edit').dispatchEvent(new MouseEvent('mouseenter'));
        await nextTick();
        expect(named('Undo')).toBeDefined();
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await nextTick();
        expect(named('Undo')).toBeUndefined();
    });

    it('becomes a menu button below its breakpoint', async () => {
        vi.spyOn(window, 'matchMedia').mockImplementation((q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
        mountVt(Menubar, { props: { model: model(), ariaLabel: 'Application' } });
        const button = document.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!;
        expect(button.getAttribute('aria-expanded')).toBe('false');
        expect(items()).toHaveLength(0);
        button.focus();
        button.click();
        await settle();
        expect(button.getAttribute('aria-expanded')).toBe('true');
        expect(document.getElementById(button.getAttribute('aria-controls')!)?.getAttribute('role')).toBe('menu');
        expect(document.activeElement).toBe(named('File'));
        await key('ArrowDown');
        expect(document.activeElement).toBe(named('Edit'));
        await key('Escape');
        expect(items()).toHaveLength(0);
        expect(document.activeElement).toBe(button);
    });

    it('has no accessibility violations, with a menu open', async () => {
        mountVt(Menubar, { props: { model: model(), ariaLabel: 'Application' } });
        await expectNoA11yViolations();
        named('File').focus();
        await key('ArrowDown');
        await expectNoA11yViolations();
    });
});

import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import SpeedDial from './SpeedDial.vue';

const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

function mountDial(props: Record<string, unknown> = {}) {
    const run = vi.fn();
    const wrapper = mountVt(SpeedDial, {
        props: {
            ariaLabel: 'Share',
            model: [
                { label: 'Copy link', icon: 'copy', command: run },
                { label: 'Download', icon: 'download', command: run },
                { label: 'Delete', icon: 'trash', disabled: true }
            ],
            ...props
        }
    });
    const trigger = () => document.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!;
    const actions = () => Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    return { wrapper, run, trigger, actions };
}

describe('SpeedDial', () => {
    it('is a named menu button controlling a menu of named actions', () => {
        const { trigger, actions } = mountDial();
        expect(trigger().getAttribute('aria-label')).toBe('Share');
        expect(trigger().getAttribute('aria-expanded')).toBe('false');
        const menu = document.getElementById(trigger().getAttribute('aria-controls')!)!;
        expect(menu.getAttribute('role')).toBe('menu');
        expect(actions().map((a) => a.getAttribute('aria-label'))).toEqual(['Copy link', 'Download', 'Delete']);
        expect(actions().every((a) => a.tabIndex === -1)).toBe(true);
    });

    it('opens from the keyboard on the first action and moves with the arrows, wrapping', async () => {
        const { trigger, actions } = mountDial();
        trigger().focus();
        await press(trigger(), 'ArrowUp');
        await settle();
        expect(trigger().getAttribute('aria-expanded')).toBe('true');
        expect(document.activeElement).toBe(actions()[0]);
        // The line opens upwards, so Up walks away from the button.
        await press(actions()[0]!, 'ArrowUp');
        await settle();
        expect(document.activeElement).toBe(actions()[1]);
        await press(actions()[1]!, 'ArrowUp');
        await settle();
        expect(document.activeElement).toBe(actions()[0]);
        await press(actions()[0]!, 'ArrowDown');
        await settle();
        expect(document.activeElement).toBe(actions()[1]);
    });

    it('runs an action, closes and gives focus back', async () => {
        const { trigger, actions, run } = mountDial();
        trigger().dispatchEvent(new MouseEvent('click', { detail: 0, bubbles: true }));
        await settle();
        expect(document.activeElement).toBe(actions()[0]);
        await press(actions()[0]!, 'Enter');
        await nextTick();
        expect(run).toHaveBeenCalledTimes(1);
        expect(trigger().getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(trigger());
    });

    it('closes on Escape and on a press outside', async () => {
        const { trigger, actions } = mountDial();
        trigger().dispatchEvent(new MouseEvent('click', { detail: 0, bubbles: true }));
        await settle();
        await press(actions()[0]!, 'Escape');
        await nextTick();
        expect(trigger().getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(trigger());
        trigger().click();
        await settle();
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await nextTick();
        expect(trigger().getAttribute('aria-expanded')).toBe('false');
    });

    it('lays a circle out around the button', async () => {
        mountDial({ type: 'circle', radius: 60, visible: true });
        const items = Array.from(document.querySelectorAll<HTMLElement>('[role="menu"] > li'));
        expect(items[0]!.style.getPropertyValue('--_x')).toBe('60px');
        expect(document.querySelector('.vt-speeddial-radial')).not.toBeNull();
    });

    it('has no accessibility violations, closed or open', async () => {
        const { trigger } = mountDial();
        await expectNoA11yViolations();
        trigger().click();
        await settle();
        await expectNoA11yViolations();
    });
});

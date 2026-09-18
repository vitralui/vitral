import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import SplitButton from './SplitButton.vue';

const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

function mountSplit(props: Record<string, unknown> = {}) {
    const run = vi.fn();
    const main = vi.fn();
    const wrapper = mountVt(SplitButton, {
        props: {
            label: 'Save',
            icon: 'check',
            model: [
                { label: 'Save as draft', command: run },
                { label: 'Save and close', command: run },
                { label: 'Discard', disabled: true }
            ],
            onClick: main,
            ...props
        }
    });
    const buttons = () => Array.from(document.querySelectorAll<HTMLButtonElement>('.vt-splitbutton > button'));
    const menu = () => document.querySelector<HTMLElement>('[role="menu"]');
    const items = () => Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    return { wrapper, run, main, buttons, menu, items };
}

describe('SplitButton', () => {
    it('runs the main command and names the menu button', async () => {
        const { buttons, main } = mountSplit();
        buttons()[0]!.click();
        expect(main).toHaveBeenCalledTimes(1);
        const toggle = buttons()[1]!;
        expect(toggle.getAttribute('aria-label')).toBe('More options');
        expect(toggle.getAttribute('aria-haspopup')).toBe('menu');
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it('opens its menu with focus on the first item, and runs a choice, giving focus back', async () => {
        const { buttons, menu, items, run } = mountSplit();
        const toggle = buttons()[1]!;
        toggle.focus();
        toggle.click();
        await settle();
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        expect(toggle.getAttribute('aria-controls')).toBe(menu()!.id);
        expect(document.activeElement).toBe(items()[0]);
        await press(items()[0]!, 'ArrowDown');
        await press(items()[1]!, 'Enter');
        await settle();
        expect(run).toHaveBeenCalledTimes(1);
        expect(menu()).toBeNull();
        expect(document.activeElement).toBe(toggle);
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it('opens from the arrows, Up landing on the last enabled item, and closes on Escape', async () => {
        const { buttons, items, menu } = mountSplit();
        const toggle = buttons()[1]!;
        toggle.focus();
        await press(toggle, 'ArrowUp');
        await settle();
        expect(document.activeElement).toBe(items()[1]);
        await press(items()[1]!, 'Escape');
        await nextTick();
        expect(menu()).toBeNull();
        expect(document.activeElement).toBe(toggle);
    });

    it('disables both buttons', () => {
        const { buttons } = mountSplit({ disabled: true });
        expect(buttons().every((b) => b.disabled)).toBe(true);
    });

    it('has no accessibility violations, closed or open', async () => {
        const { buttons } = mountSplit();
        await expectNoA11yViolations();
        buttons()[1]!.click();
        await settle();
        await expectNoA11yViolations();
    });
});

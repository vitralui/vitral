import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Toolbar from './Toolbar.vue';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function mountToolbar(props: Record<string, unknown> = {}) {
    const wrapper = mountVt(Toolbar, {
        props,
        attrs: { 'aria-label': 'Formatting' },
        slots: {
            start: () => [h('button', { type: 'button' }, 'Bold'), h('button', { type: 'button' }, 'Italic'), h('button', { type: 'button', disabled: true }, 'Strike')],
            center: () => h('input', { type: 'text', 'aria-label': 'Font size' }),
            end: () => h('button', { type: 'button' }, 'Clear')
        }
    });
    const root = wrapper.element as HTMLElement;
    const buttons = () => Array.from(root.querySelectorAll<HTMLButtonElement>('button'));
    const input = () => root.querySelector('input')!;
    return { wrapper, buttons, input };
}

describe('Toolbar', () => {
    it('is a named toolbar with start, center and end groups', () => {
        const { wrapper } = mountToolbar();
        expect(wrapper.attributes('role')).toBe('toolbar');
        expect(wrapper.attributes('aria-label')).toBe('Formatting');
        expect(wrapper.find('.vt-toolbar-start').exists()).toBe(true);
        expect(wrapper.find('.vt-toolbar-center').exists()).toBe(true);
        expect(wrapper.find('.vt-toolbar-end').exists()).toBe(true);
    });

    it('leaves the tab order alone without `roving`', async () => {
        const { buttons } = mountToolbar();
        expect(buttons().every((b) => !b.hasAttribute('tabindex'))).toBe(true);
        buttons()[0]!.focus();
        await press(buttons()[0]!, 'ArrowRight');
        expect(document.activeElement).toBe(buttons()[0]);
    });

    it('with `roving`, is one tab stop that the arrows, Home and End move through', async () => {
        const { buttons, input } = mountToolbar({ roving: true });
        const [bold, italic, strike, clear] = buttons();
        expect(bold!.tabIndex).toBe(0);
        expect([italic!.tabIndex, clear!.tabIndex, input().tabIndex]).toEqual([-1, -1, -1]);

        bold!.focus();
        await press(bold!, 'ArrowRight');
        expect(document.activeElement).toBe(italic);
        expect(italic!.tabIndex).toBe(0);
        expect(bold!.tabIndex).toBe(-1);

        // The disabled button is skipped; the text field is a stop of its own.
        await press(italic!, 'ArrowRight');
        expect(document.activeElement).toBe(input());
        expect(strike!.hasAttribute('tabindex')).toBe(false);

        await press(input(), 'End');
        expect(document.activeElement).toBe(input());

        clear!.focus();
        await press(clear!, 'ArrowRight');
        expect(document.activeElement).toBe(bold);
        await press(bold!, 'ArrowLeft');
        expect(document.activeElement).toBe(clear);
        await press(clear!, 'Home');
        expect(document.activeElement).toBe(bold);
        await press(bold!, 'End');
        expect(document.activeElement).toBe(clear);
    });

    it('follows focus given by a click, keeps a stop when controls change, and restores the tab order when turned off', async () => {
        const { wrapper, buttons } = mountToolbar({ roving: true });
        const [bold, italic, , clear] = buttons();
        clear!.focus();
        expect(clear!.tabIndex).toBe(0);
        expect(bold!.tabIndex).toBe(-1);

        clear!.disabled = true;
        await flush();
        expect(bold!.tabIndex).toBe(0);

        await wrapper.setProps({ roving: false });
        await nextTick();
        expect([bold!, italic!].every((b) => !b.hasAttribute('tabindex'))).toBe(true);
    });

    it('has no accessibility violations', async () => {
        mountToolbar({ roving: true });
        await expectNoA11yViolations();
    });
});

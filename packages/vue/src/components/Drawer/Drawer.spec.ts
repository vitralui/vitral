import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Drawer from './Drawer.vue';

function mountDrawer(props: Record<string, unknown> = {}) {
    const visible = ref(false);
    const wrapper = mountVt(
        defineComponent(() => () => [
            h('button', { id: 'opener' }, 'Menu'),
            h(
                Drawer,
                { header: 'Navigation', ...props, visible: visible.value, 'onUpdate:visible': (v: boolean) => (visible.value = v) },
                { default: () => h('a', { href: '#inbox' }, 'Inbox') }
            )
        ])
    );
    const drawer = () => document.querySelector<HTMLElement>('[role="dialog"]');
    async function open() {
        document.getElementById('opener')!.focus();
        visible.value = true;
        await nextTick();
        await nextTick();
    }
    return { wrapper, visible, drawer, open };
}

describe('Drawer', () => {
    it('opens as a modal dialog against its edge, named by its header, focus inside', async () => {
        const { drawer, open } = mountDrawer({ position: 'right' });
        expect(drawer()).toBeNull();
        await open();
        const el = drawer()!;
        expect(el.getAttribute('aria-modal')).toBe('true');
        expect(document.getElementById(el.getAttribute('aria-labelledby')!)?.textContent?.trim()).toBe('Navigation');
        expect(el.classList).toContain('vt-drawer-right');
        expect(document.activeElement?.textContent).toBe('Inbox');
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('closes on Escape and returns focus', async () => {
        const { drawer, open } = mountDrawer();
        await open();
        await press(document.activeElement!, 'Escape');
        expect(drawer()).toBeNull();
        expect(document.activeElement?.id).toBe('opener');
        expect(document.body.style.overflow).toBe('');
    });

    it('closes on a press on the mask by default, and not when dismissable is off', async () => {
        const first = mountDrawer();
        await first.open();
        const mask = first.drawer()!.parentElement!;
        mask.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        mask.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await nextTick();
        expect(first.drawer()).toBeNull();
        first.wrapper.unmount();

        const second = mountDrawer({ dismissable: false });
        await second.open();
        const mask2 = second.drawer()!.parentElement!;
        mask2.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        mask2.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await nextTick();
        expect(second.drawer()).not.toBeNull();
    });

    it('closes from its named close button', async () => {
        const { drawer, open, wrapper } = mountDrawer();
        await open();
        drawer()!.querySelector<HTMLButtonElement>('button[aria-label="Close"]')!.click();
        await nextTick();
        expect(drawer()).toBeNull();
        expect(wrapper.findComponent(Drawer).emitted('hide')).toHaveLength(1);
    });

    it('has no accessibility violations, closed or open', async () => {
        const { open } = mountDrawer({ position: 'bottom' });
        await expectNoA11yViolations();
        await open();
        await expectNoA11yViolations();
    });
});

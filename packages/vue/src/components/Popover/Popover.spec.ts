import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Popover from './Popover.vue';

function mountPopover(props: Record<string, unknown> = {}) {
    const op = ref<InstanceType<typeof Popover> | null>(null);
    const wrapper = mountVt(
        defineComponent(() => () => [
            h(
                'button',
                { id: 'trigger', 'aria-haspopup': 'dialog', 'aria-expanded': op.value?.visible ? 'true' : 'false', onClick: (e: Event) => op.value?.toggle(e) },
                'Filters'
            ),
            h('button', { id: 'after' }, 'After'),
            h(Popover, { ref: op, 'aria-label': 'Filters', ...props }, { default: () => [h('button', { id: 'first' }, 'Apply'), h('button', { id: 'last' }, 'Reset')] })
        ])
    );
    const panel = () => document.querySelector<HTMLElement>('[role="dialog"]');
    const trigger = () => document.getElementById('trigger') as HTMLButtonElement;
    async function open() {
        trigger().focus();
        trigger().click();
        await nextTick();
        await nextTick();
    }
    return { wrapper, op, panel, trigger, open };
}

describe('Popover', () => {
    it('opens from its trigger as a named, non-modal dialog and moves focus in', async () => {
        const { wrapper, panel, open, trigger } = mountPopover();
        expect(panel()).toBeNull();
        await open();
        expect(panel()!.getAttribute('aria-label')).toBe('Filters');
        expect(panel()!.hasAttribute('aria-modal')).toBe(false);
        expect(document.activeElement?.id).toBe('first');
        expect(trigger().getAttribute('aria-expanded')).toBe('true');
        expect(wrapper.findComponent(Popover).emitted('show')).toHaveLength(1);
    });

    it('closes on Escape and returns focus to the trigger', async () => {
        const { wrapper, panel, open, trigger } = mountPopover();
        await open();
        await press(document.activeElement!, 'Escape');
        expect(panel()).toBeNull();
        expect(document.activeElement).toBe(trigger());
        expect(wrapper.findComponent(Popover).emitted('hide')).toHaveLength(1);
    });

    it('closes on a press outside, leaving focus alone', async () => {
        const { panel, open } = mountPopover();
        await open();
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await nextTick();
        expect(panel()).toBeNull();
    });

    it('stays open on a press outside when not dismissable', async () => {
        const { panel, open } = mountPopover({ dismissable: false });
        await open();
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await nextTick();
        expect(panel()).not.toBeNull();
    });

    it('closes when Tab leaves either end, continuing from the trigger', async () => {
        const { panel, open, trigger } = mountPopover();
        await open();
        const last = document.getElementById('last')!;
        last.focus();
        await press(last, 'Tab');
        expect(panel()).toBeNull();
        expect(document.activeElement?.id).toBe('after');

        await open();
        await press(document.getElementById('first')!, 'Tab', { shiftKey: true });
        expect(panel()).toBeNull();
        expect(document.activeElement).toBe(trigger());
    });

    it('toggles, and exposes show and hide', async () => {
        const { op, panel, open, trigger } = mountPopover();
        await open();
        trigger().click();
        await nextTick();
        expect(panel()).toBeNull();
        op.value!.show(undefined, trigger());
        await nextTick();
        expect(panel()).not.toBeNull();
        expect(op.value!.visible).toBe(true);
        op.value!.hide();
        await nextTick();
        expect(panel()).toBeNull();
    });

    it('has no accessibility violations, closed or open', async () => {
        const { open } = mountPopover();
        await expectNoA11yViolations();
        await open();
        await expectNoA11yViolations();
    });
});

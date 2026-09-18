import { describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Inplace from './Inplace.vue';

function mountInplace(props: Record<string, unknown> = {}) {
    const wrapper = mountVt(Inplace, {
        props,
        slots: {
            display: () => 'Edit name',
            content: ({ closeCallback }: { closeCallback: () => void }) => [h('input', { 'aria-label': 'Name', value: 'Ada' }), h('button', { onClick: closeCallback }, 'Done')]
        }
    });
    const display = () => document.querySelector<HTMLElement>('[role="button"]');
    const input = () => document.querySelector<HTMLInputElement>('input');
    return { wrapper, display, input };
}

describe('Inplace', () => {
    it('is a button that becomes its content, focusing the first control', async () => {
        const { display, input, wrapper } = mountInplace();
        expect(display()!.tabIndex).toBe(0);
        expect(input()).toBeNull();
        await press(display()!, 'Enter');
        await nextTick();
        expect(display()).toBeNull();
        expect(document.activeElement).toBe(input());
        expect(wrapper.emitted('update:active')?.[0]).toEqual([true]);
    });

    it('goes back from the close button or Escape, focusing the display again', async () => {
        const { display } = mountInplace({ closable: true });
        display()!.click();
        await nextTick();
        const close = document.querySelector<HTMLButtonElement>('button[aria-label="Close"]')!;
        close.click();
        await nextTick();
        await nextTick();
        expect(document.activeElement).toBe(display());
        await press(display()!, ' ');
        await nextTick();
        await press(document.activeElement!, 'Escape');
        await nextTick();
        await nextTick();
        expect(document.activeElement).toBe(display());
    });

    it('closes through the content slot callback', async () => {
        const { display } = mountInplace();
        display()!.click();
        await nextTick();
        Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'Done')!.click();
        await nextTick();
        expect(display()).not.toBeNull();
    });

    it('stays put when disabled', async () => {
        const { display } = mountInplace({ disabled: true });
        expect(display()!.getAttribute('aria-disabled')).toBe('true');
        display()!.click();
        await nextTick();
        expect(display()).not.toBeNull();
    });

    it('has no accessibility violations in either state', async () => {
        const { display } = mountInplace({ closable: true });
        await expectNoA11yViolations();
        display()!.click();
        await nextTick();
        await expectNoA11yViolations();
    });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import CopyButton from './CopyButton.vue';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function clipboard() {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    return writeText;
}

afterEach(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
});

describe('CopyButton', () => {
    it('copies its value, swaps in a tick and says so', async () => {
        const writeText = clipboard();
        const wrapper = mountVt(CopyButton, { props: { value: 'npm i @vitral/vue' } });
        const button = wrapper.get('button');
        expect(button.attributes('aria-label')).toBe('Copy');
        await button.trigger('click');
        await tick();
        await tick();
        expect(writeText).toHaveBeenCalledWith('npm i @vitral/vue');
        expect(wrapper.emitted('copy')![0]).toEqual(['npm i @vitral/vue']);
        expect(button.classes()).toContain('vt-copybutton-copied');
        expect(wrapper.get('[role="status"]').text()).toBe('Copied');
    });

    it('waits for a value given as a function, and shows the copied label for a while', async () => {
        vi.useFakeTimers();
        const writeText = clipboard();
        const wrapper = mountVt(CopyButton, { props: { value: async () => 'later', label: 'Copy link', copiedLabel: 'Copied!', timeout: 1000 } });
        await wrapper.get('button').trigger('click');
        await vi.advanceTimersByTimeAsync(10);
        expect(writeText).toHaveBeenCalledWith('later');
        expect(wrapper.get('button').text()).toBe('Copied!');
        await vi.advanceTimersByTimeAsync(1000);
        expect(wrapper.get('button').text()).toBe('Copy link');
        vi.useRealTimers();
    });

    it('reports a copy that failed', async () => {
        Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true });
        const wrapper = mountVt(CopyButton, { props: { value: 'x' } });
        await wrapper.get('button').trigger('click');
        await tick();
        expect(wrapper.emitted('error')).toHaveLength(1);
    });

    it('puts class on the wrapper and every other attribute on the button', () => {
        const wrapper = mountVt(CopyButton, { props: { value: 'x' }, attrs: { class: 'here', 'data-test': 'copy' } });
        expect(wrapper.classes()).toContain('here');
        expect(wrapper.get('button').attributes('data-test')).toBe('copy');
    });

    it('has no accessibility violations', async () => {
        mountVt(CopyButton, { props: { value: 'x' } });
        mountVt(CopyButton, { props: { value: 'x', label: 'Copy code', variant: 'outlined' } });
        await expectNoA11yViolations();
    });
});

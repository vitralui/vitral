import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Label from './Label.vue';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Label', () => {
    afterEach(() => vi.restoreAllMocks());

    it('is a native label that names its control, with a hidden required mark', async () => {
        mountVt(defineComponent(() => () => [h(Label, { for: 'email', required: true }, () => 'Email'), h('input', { id: 'email', required: true })]));
        const input = document.querySelector<HTMLInputElement>('#email')!;
        const label = document.querySelector('label')!;
        expect(input.labels?.[0]).toBe(label);
        expect(label.querySelector('[aria-hidden="true"]')?.textContent).toBe('*');
        await expectNoA11yViolations();
    });

    it('dims with its control, following it as it changes', async () => {
        const off = ref(true);
        mountVt(defineComponent(() => () => [h(Label, { for: 'name' }, () => 'Name'), h('input', { id: 'name', disabled: off.value })]));
        await settle();
        const label = document.querySelector('label')!;
        expect(label.classList.contains('vt-label-disabled')).toBe(true);
        off.value = false;
        await nextTick();
        await settle();
        expect(label.classList.contains('vt-label-disabled')).toBe(false);
    });

    it('warns when its for points at nothing, or at something a label cannot name', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        mountVt(defineComponent(() => () => [h(Label, { for: 'missing' }, () => 'A'), h(Label, { for: 'group' }, () => 'B'), h('div', { id: 'group', role: 'radiogroup' })]));
        await settle();
        expect(warn).toHaveBeenCalledTimes(2);
        expect(String(warn.mock.calls[0]![0])).toContain('points at no element');
        expect(String(warn.mock.calls[1]![0])).toContain('aria-labelledby');
    });

    it('takes a size and an explicit disabled state', () => {
        mountVt(Label, { props: { size: 'small', disabled: true }, slots: { default: () => 'Small' } });
        const label = document.querySelector('label')!;
        expect(label.className).toBe('vt-label vt-label-sm vt-label-disabled');
    });
});

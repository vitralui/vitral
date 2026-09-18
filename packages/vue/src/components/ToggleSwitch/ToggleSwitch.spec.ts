import { ptBR } from '@vitral/core';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import type { VitralOptions } from '../../config/config';
import ToggleSwitch from './ToggleSwitch.vue';

function mountSwitch(props: Record<string, unknown> = {}, initial = false, vitral: VitralOptions = { theme: 'none' }) {
    const value = ref(initial);
    const wrapper = mountVt(
        defineComponent(() => () => h(ToggleSwitch, { label: 'Wi-Fi', ...props, modelValue: value.value, 'onUpdate:modelValue': (v: boolean) => (value.value = v) })),
        {},
        vitral
    );
    const input = () => wrapper.get('input').element as HTMLInputElement;
    const content = () => document.querySelector<HTMLElement>('.vt-toggleswitch-content');
    return { wrapper, value, input, content };
}

describe('ToggleSwitch', () => {
    it('is a native checkbox with the switch role, named by its header', () => {
        const { input } = mountSwitch();
        expect(input().type).toBe('checkbox');
        expect(input().getAttribute('role')).toBe('switch');
        expect(input().checked).toBe(false);
        expect(input().labels).toHaveLength(1);
        expect(input().labels?.[0]?.textContent?.trim()).toBe('Wi-Fi');
    });

    it('toggles from the track, from its header and from its on/off text', async () => {
        const { input, value, wrapper, content } = mountSwitch({ showStateLabel: true });
        input().click();
        await nextTick();
        expect(value.value).toBe(true);
        expect(input().checked).toBe(true);
        expect(wrapper.find('.vt-toggleswitch').classes()).toContain('vt-toggleswitch-checked');
        await wrapper.get('label').trigger('click');
        expect(value.value).toBe(false);
        content()!.click();
        await nextTick();
        expect(value.value).toBe(true);
    });

    it("shows the locale's On/Off when asked, hidden from assistive technology so the name stays the header", async () => {
        const { input, content } = mountSwitch({ showStateLabel: true });
        expect(content()?.textContent?.trim()).toBe('Off');
        expect(content()?.getAttribute('aria-hidden')).toBe('true');
        input().click();
        await nextTick();
        expect(content()?.textContent?.trim()).toBe('On');

        document.body.innerHTML = '';
        const translated = mountSwitch({ showStateLabel: true }, true, { theme: 'none', locale: ptBR });
        expect(translated.content()?.textContent?.trim()).toBe('Ligado');
    });

    it('prefers its own on and off labels, and shows no content without either', async () => {
        const custom = mountSwitch({ onLabel: 'Visible', offLabel: 'Hidden' });
        expect(custom.content()?.textContent?.trim()).toBe('Hidden');
        custom.input().click();
        await nextTick();
        expect(custom.content()?.textContent?.trim()).toBe('Visible');
        custom.wrapper.unmount();
        document.body.innerHTML = '';
        expect(mountSwitch().content()).toBeNull();
    });

    it('emits change with the new state', async () => {
        const { wrapper, input } = mountSwitch();
        input().click();
        await nextTick();
        expect(wrapper.findComponent(ToggleSwitch).emitted('change')?.[0]?.[0]).toMatchObject({ checked: true });
    });

    it('does not toggle while disabled', async () => {
        const { input, value, content } = mountSwitch({ disabled: true, showStateLabel: true });
        expect(input().disabled).toBe(true);
        input().click();
        content()!.click();
        await nextTick();
        expect(value.value).toBe(false);
    });

    it('marks an invalid switch for assistive technology', () => {
        const { input, wrapper } = mountSwitch({ invalid: true });
        expect(input().getAttribute('aria-invalid')).toBe('true');
        expect(wrapper.find('.vt-toggleswitch').classes()).toContain('vt-toggleswitch-invalid');
    });

    it('sends class and style to the wrapper and every other attribute to the input', () => {
        const wrapper = mountVt(ToggleSwitch, { attrs: { id: 'wifi', name: 'wifi', class: 'spaced', 'aria-label': 'Wi-Fi' } });
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-toggleswitch', 'spaced']));
        expect(wrapper.get('input').attributes()).toMatchObject({ id: 'wifi', name: 'wifi', 'aria-label': 'Wi-Fi' });
    });

    it('is one tab stop, and leaves Space to the browser, which toggles a checkbox natively', async () => {
        const { input, value } = mountSwitch();
        expect(input().tabIndex).toBe(0);
        input().focus();
        expect(document.activeElement).toBe(input());
        const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        input().dispatchEvent(space);
        expect(space.defaultPrevented).toBe(false);
        await press(input(), 'Enter');
        expect(value.value).toBe(false);
    });

    it('has no accessibility violations: off, on, with state text, disabled, named by aria-label', async () => {
        mountSwitch();
        mountSwitch({ label: 'Bluetooth', showStateLabel: true }, true);
        mountSwitch({ label: 'Airplane mode', disabled: true, invalid: true });
        mountVt(ToggleSwitch, { props: { onLabel: 'Dark', offLabel: 'Light' }, attrs: { 'aria-label': 'Theme' } });
        await expectNoA11yViolations();
    });
});

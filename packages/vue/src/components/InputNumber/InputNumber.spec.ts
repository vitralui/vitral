import { ptBR } from '@vitral/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import type { VitralOptions } from '../../config/config';
import InputNumber from './InputNumber.vue';

function mountNumber(props: Record<string, unknown> = {}, vitral: VitralOptions = { theme: 'none' }) {
    const value = ref<number | null>((props.modelValue as number | null | undefined) ?? null);
    const onInput = vi.fn();
    const wrapper = mountVt(
        defineComponent(() => () => [
            h('label', { for: 'qty' }, 'Quantity'),
            h(InputNumber, { id: 'qty', ...props, modelValue: value.value, 'onUpdate:modelValue': (v: number | null | undefined) => (value.value = v ?? null), onInput })
        ]),
        {},
        vitral
    );
    const input = () => document.getElementById('qty') as HTMLInputElement;
    const type = async (text: string) => {
        input().value = text;
        input().dispatchEvent(new Event('input', { bubbles: true }));
        await nextTick();
    };
    const blur = async () => {
        input().focus();
        input().blur();
        await nextTick();
    };
    const button = (name: string) => document.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
    return { wrapper, value, input, type, blur, button, onInput };
}

const pointer = (type: string) => new (window.PointerEvent ?? MouseEvent)(type, { bubbles: true, cancelable: true, button: 0 });

describe('InputNumber', () => {
    afterEach(() => vi.useRealTimers());

    it('is a spinbutton showing its value formatted, with the number and its text for assistive technology', () => {
        const { input } = mountNumber({ modelValue: 1234.5, min: 0, max: 10000 });
        expect(input().getAttribute('role')).toBe('spinbutton');
        expect(input().value).toBe('1,234.5');
        expect(input().getAttribute('aria-valuenow')).toBe('1234.5');
        expect(input().getAttribute('aria-valuetext')).toBe('1,234.5');
        expect(input().getAttribute('aria-valuemin')).toBe('0');
        expect(input().getAttribute('aria-valuemax')).toBe('10000');
        expect(input().labels?.[0]?.textContent).toBe('Quantity');
    });

    it('reads the text while typing and commits it, formatted, on blur', async () => {
        const { input, type, blur, value, onInput } = mountNumber({ modelValue: 1 });
        await type('2500.5');
        expect(onInput).toHaveBeenLastCalledWith(expect.objectContaining({ value: 2500.5 }));
        expect(input().getAttribute('aria-valuenow')).toBe('2500.5');
        expect(value.value).toBe(1);
        await blur();
        expect(value.value).toBe(2500.5);
        expect(input().value).toBe('2,500.5');
    });

    it('commits on Enter', async () => {
        const { input, type, value } = mountNumber();
        await type('42');
        await press(input(), 'Enter');
        expect(value.value).toBe(42);
    });

    it('clamps what was typed to min and max', async () => {
        const { input, type, blur, value } = mountNumber({ min: 0, max: 100 });
        await type('150');
        await blur();
        expect(value.value).toBe(100);
        expect(input().value).toBe('100');
        await type('-5');
        await blur();
        expect(value.value).toBe(0);
    });

    it('goes back to the last value when the text holds no number', async () => {
        const { input, type, blur, value } = mountNumber({ modelValue: 7 });
        await type('abc');
        expect(input().hasAttribute('aria-valuenow')).toBe(false);
        await blur();
        expect(value.value).toBe(7);
        expect(input().value).toBe('7');
    });

    it('empties to null, unless empty is not allowed', async () => {
        const allowed = mountNumber({ modelValue: 7 });
        await allowed.type('');
        await allowed.blur();
        expect(allowed.value.value).toBeNull();
        allowed.wrapper.unmount();
        document.body.innerHTML = '';

        const refused = mountNumber({ modelValue: 7, allowEmpty: false });
        await refused.type('');
        await refused.blur();
        expect(refused.value.value).toBe(7);
        expect(refused.input().value).toBe('7');
    });

    it('steps with the arrows, ten steps with PageUp/PageDown, and jumps to the bounds with Home/End', async () => {
        const { input, value } = mountNumber({ modelValue: 50, min: 0, max: 100, step: 2 });
        await press(input(), 'ArrowUp');
        expect(value.value).toBe(52);
        await press(input(), 'ArrowDown');
        await press(input(), 'ArrowDown');
        expect(value.value).toBe(48);
        await press(input(), 'PageUp');
        expect(value.value).toBe(68);
        await press(input(), 'PageDown');
        expect(value.value).toBe(48);
        await press(input(), 'End');
        expect(value.value).toBe(100);
        expect(input().getAttribute('aria-valuenow')).toBe('100');
        await press(input(), 'ArrowUp');
        expect(value.value).toBe(100);
        await press(input(), 'Home');
        expect(value.value).toBe(0);
    });

    it('leaves Home and End to the caret when there is no bound', async () => {
        const { input, value } = mountNumber({ modelValue: 5 });
        const home = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true });
        input().dispatchEvent(home);
        expect(home.defaultPrevented).toBe(false);
        expect(value.value).toBe(5);
    });

    it('steps from what is being typed, without floating-point noise', async () => {
        const { input, type, value } = mountNumber({ modelValue: 0, step: 0.1 });
        await type('0.2');
        await press(input(), 'ArrowUp');
        expect(value.value).toBe(0.3);
        expect(input().value).toBe('0.3');
    });

    it('formats and reads currency in the locale given', async () => {
        const { input, type, blur, value } = mountNumber({ modelValue: 1234.56, mode: 'currency', currency: 'BRL', locale: 'pt-BR' });
        expect(input().value).toMatch(/^R\$\s1\.234,56$/);
        await type('R$ 99,9');
        await blur();
        expect(value.value).toBe(99.9);
        expect(input().value).toMatch(/^R\$\s99,90$/);
    });

    it("formats in the Vitral locale when it is not given one", () => {
        const { input } = mountNumber({ modelValue: 1234.5 }, { theme: 'none', locale: ptBR });
        expect(input().value).toBe('1.234,5');
    });

    it('reads percentages as fractions, and keeps prefix and suffix out of the value', async () => {
        const percent = mountNumber({ modelValue: 0.25, mode: 'percent' });
        expect(percent.input().value).toBe('25%');
        await percent.type('50');
        await percent.blur();
        expect(percent.value.value).toBe(0.5);
        percent.wrapper.unmount();
        document.body.innerHTML = '';

        const distance = mountNumber({ modelValue: 12, suffix: ' km' });
        expect(distance.input().value).toBe('12 km');
        await distance.type('15 km');
        await distance.blur();
        expect(distance.value.value).toBe(15);
    });

    it('rounds the committed value to the digits it shows', async () => {
        const { type, blur, value } = mountNumber({ maxFractionDigits: 2 });
        await type('3.14159');
        await blur();
        expect(value.value).toBe(3.14);
    });

    it('has spin buttons that are named, controlled from the input and out of the tab order', async () => {
        const { button, value } = mountNumber({ modelValue: 1, max: 2, showButtons: true });
        const up = button('Increase');
        const down = button('Decrease');
        expect(up.tabIndex).toBe(-1);
        expect(down.tabIndex).toBe(-1);
        expect(up.getAttribute('aria-controls')).toBe('qty');
        up.click();
        await nextTick();
        expect(value.value).toBe(2);
        expect(up.disabled).toBe(true);
        down.click();
        await nextTick();
        expect(value.value).toBe(1);
    });

    it('repeats while a spin button is held, and stops when it is let go', async () => {
        vi.useFakeTimers();
        const { button, value, input } = mountNumber({ modelValue: 0, showButtons: true });
        button('Increase').dispatchEvent(pointer('pointerdown'));
        expect(value.value).toBe(1);
        expect(document.activeElement).toBe(input());
        // The async variant lets the parent re-render between repeats, as a real frame would.
        await vi.advanceTimersByTimeAsync(400);
        expect(value.value).toBe(2);
        await vi.advanceTimersByTimeAsync(150);
        expect(value.value).toBe(5);
        document.dispatchEvent(pointer('pointerup'));
        await vi.advanceTimersByTimeAsync(1000);
        expect(value.value).toBe(5);
    });

    it('lays the buttons out either side in the horizontal layout', () => {
        const { wrapper } = mountNumber({ showButtons: true, buttonLayout: 'horizontal' });
        const root = wrapper.find('.vt-inputnumber').element;
        expect(root.classList).toContain('vt-inputnumber-horizontal');
        expect(root.firstElementChild?.getAttribute('aria-label')).toBe('Decrease');
        expect(root.lastElementChild?.getAttribute('aria-label')).toBe('Increase');
    });

    it('names its buttons in the Vitral locale', () => {
        const { button } = mountNumber({ showButtons: true }, { theme: 'none', locale: ptBR });
        expect(button('Aumentar')).not.toBeNull();
        expect(button('Diminuir')).not.toBeNull();
    });

    it('does not change while read-only or disabled', async () => {
        const readonly = mountNumber({ modelValue: 3, readonly: true, showButtons: true });
        await press(readonly.input(), 'ArrowUp');
        expect(readonly.value.value).toBe(3);
        expect(readonly.button('Increase').disabled).toBe(true);
        expect(readonly.input().readOnly).toBe(true);
        readonly.wrapper.unmount();
        document.body.innerHTML = '';

        const disabled = mountNumber({ modelValue: 3, disabled: true });
        expect(disabled.input().disabled).toBe(true);
    });

    it('has no accessibility violations, stacked and horizontal', async () => {
        mountNumber({ modelValue: 5, min: 0, max: 10, showButtons: true, invalid: true });
        mountVt(InputNumber, { props: { modelValue: 0.5, mode: 'percent', showButtons: true, buttonLayout: 'horizontal' }, attrs: { 'aria-label': 'Opacity' } });
        await expectNoA11yViolations();
    });
});

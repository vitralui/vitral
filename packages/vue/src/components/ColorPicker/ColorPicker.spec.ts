import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import ColorPicker from './ColorPicker.vue';

function mountPicker(props: Record<string, unknown> = {}) {
    const value = ref<unknown>(props.modelValue ?? '336699');
    const changes: unknown[] = [];
    mountVt(
        defineComponent(() => () =>
            h(ColorPicker, {
                ...props,
                modelValue: value.value as never,
                'onUpdate:modelValue': (v: unknown) => (value.value = v),
                onChange: (e: { value: unknown }) => changes.push(e.value)
            })
        )
    );
    const swatch = () => document.querySelector<HTMLButtonElement>('button.vt-colorpicker-swatch')!;
    const area = () => document.querySelector<HTMLElement>('[role="slider"][aria-label="Saturation and brightness"]')!;
    const hue = () => document.querySelector<HTMLElement>('[role="slider"][aria-label="Hue"]')!;
    const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
    return { value, changes, swatch, area, hue, dialog };
}

describe('ColorPicker', () => {
    it('is a swatch button named by its colour, opening a dialog with focus on the area', async () => {
        const { swatch, dialog, area } = mountPicker();
        expect(swatch().getAttribute('aria-label')).toBe('Colour #336699');
        expect(swatch().getAttribute('aria-haspopup')).toBe('dialog');
        expect(swatch().getAttribute('aria-expanded')).toBe('false');
        swatch().click();
        await nextTick();
        await nextTick();
        expect(swatch().getAttribute('aria-expanded')).toBe('true');
        expect(swatch().getAttribute('aria-controls')).toBe(dialog()!.id);
        expect(dialog()!.getAttribute('aria-label')).toBe('Colour');
        expect(document.activeElement).toBe(area());
    });

    it('exposes the area and hue as sliders with values', async () => {
        const { area, hue } = mountPicker({ inline: true });
        expect(area().getAttribute('aria-valuenow')).toBe('67');
        expect(area().getAttribute('aria-valuetext')).toBe('Saturation 67%, brightness 60%');
        expect(hue().getAttribute('aria-valuenow')).toBe('210');
        expect(hue().getAttribute('aria-valuemax')).toBe('360');
    });

    it('changes saturation, brightness and hue from the keyboard', async () => {
        const { area, hue, value, changes } = mountPicker({ inline: true, format: 'hsb', modelValue: { h: 100, s: 50, b: 50 } });
        await press(area(), 'ArrowRight');
        expect(value.value).toEqual({ h: 100, s: 51, b: 50 });
        await press(area(), 'ArrowUp', { shiftKey: true });
        expect(value.value).toEqual({ h: 100, s: 51, b: 60 });
        await press(area(), 'Home');
        expect(value.value).toEqual({ h: 100, s: 0, b: 60 });
        await press(hue(), 'ArrowLeft');
        expect(value.value).toEqual({ h: 99, s: 0, b: 60 });
        await press(hue(), 'End');
        expect(value.value).toEqual({ h: 360, s: 0, b: 60 });
        expect(changes).toHaveLength(5);
    });

    it('takes a hex value typed into the box, and restores an invalid one', async () => {
        const { value } = mountPicker({ inline: true });
        const input = document.querySelector<HTMLInputElement>('input[aria-label="Hex"]')!;
        expect(input.value).toBe('336699');
        input.value = '#ff8800';
        input.dispatchEvent(new Event('input'));
        await press(input, 'Enter');
        expect(value.value).toBe('ff8800');
        input.value = 'nope';
        input.dispatchEvent(new Event('input'));
        input.dispatchEvent(new Event('change'));
        await nextTick();
        expect(input.value).toBe('ff8800');
    });

    it('sets the colour under the pointer', async () => {
        const { area, value } = mountPicker({ inline: true, format: 'rgb', modelValue: { r: 255, g: 0, b: 0 } });
        area().getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
        area().dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, clientY: 0, bubbles: true }));
        expect(value.value).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('closes on Escape and gives focus back', async () => {
        const { swatch, dialog, area } = mountPicker();
        swatch().click();
        await nextTick();
        await nextTick();
        await press(area(), 'Escape');
        await nextTick();
        expect(dialog()).toBeNull();
        expect(document.activeElement).toBe(swatch());
    });

    it('has no accessibility violations, closed, open and inline', async () => {
        const { swatch } = mountPicker();
        await expectNoA11yViolations();
        swatch().click();
        await nextTick();
        await expectNoA11yViolations();
    });

    it('has no accessibility violations inline', async () => {
        mountPicker({ inline: true, 'aria-label': 'Brand colour' });
        expect(document.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe('Brand colour');
        await expectNoA11yViolations();
    });

    it('paints the colour over the chequer, not under it', async () => {
        const { swatch, dialog } = mountPicker({ alpha: true, modelValue: '3366994d' });
        // A background image paints above a background colour, and the chequer
        // is one: the colour has to be its own layer or every swatch shows its
        // squares whatever its opacity is.
        expect(swatch().style.backgroundColor).toBe('');
        expect(swatch().style.getPropertyValue('--vt-colorpicker-color')).toBe('rgba(51, 102, 153, 0.302)');
        swatch().click();
        await nextTick();
        const preview = dialog()!.querySelector<HTMLElement>('.vt-colorpicker-preview')!;
        expect(preview.style.backgroundColor).toBe('');
        expect(preview.style.getPropertyValue('--vt-colorpicker-color')).toBe('rgba(51, 102, 153, 0.302)');
    });

    it('carries an opacity when asked, and none when not', async () => {
        const { value, swatch, dialog } = mountPicker({ alpha: true, modelValue: '3366994d' });
        swatch().click();
        await nextTick();
        const slider = dialog()!.querySelector<HTMLElement>('[role="slider"][aria-label="Opacity"]')!;
        expect(slider).toBeTruthy();
        expect(slider.getAttribute('aria-valuenow')).toBe('30');

        await press(slider, 'ArrowRight');
        // Eight hex digits: the colour is untouched, the paint is not.
        expect(String(value.value).slice(0, 6)).toBe('336699');
        expect(String(value.value)).toHaveLength(8);
        expect(Number(slider.getAttribute('aria-valuenow'))).toBe(31);

        // A picker that was never asked for one goes on returning six digits.
        document.body.innerHTML = '';
        const plain = mountPicker({ modelValue: '336699' });
        plain.swatch().click();
        await nextTick();
        expect(plain.dialog()!.querySelector('[aria-label="Opacity"]')).toBeNull();
        const hue = plain.dialog()!.querySelector<HTMLElement>('[role="slider"][aria-label="Hue"]')!;
        await press(hue, 'ArrowRight');
        expect(String(plain.value.value)).toHaveLength(6);
    });
});

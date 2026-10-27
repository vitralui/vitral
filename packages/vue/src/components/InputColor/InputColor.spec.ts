import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import InputColor from './InputColor.vue';

function mountField(props: Record<string, unknown> = {}) {
    const value = ref<string | null | undefined>(props.modelValue as string | null | undefined);
    const cleared: number[] = [];
    mountVt(
        defineComponent(() => () => [
            h('label', { for: 'colour' }, 'Colour of the class'),
            h(InputColor, {
                id: 'colour',
                ...props,
                modelValue: value.value,
                'onUpdate:modelValue': (v: string | null | undefined) => (value.value = v),
                onClear: () => cleared.push(1)
            })
        ])
    );
    const input = () => document.querySelector<HTMLInputElement>('#colour')!;
    const swatch = () => document.querySelector<HTMLButtonElement>('button.vt-inputcolor-swatch')!;
    const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
    const type = async (text: string) => {
        input().value = text;
        input().dispatchEvent(new Event('input'));
        await nextTick();
    };
    return { value, cleared, input, swatch, dialog, type };
}

const opened = async () => {
    await nextTick();
    await nextTick();
};

describe('InputColor', () => {
    it('is a labelled text box showing the colour as hex, painted in its swatch', () => {
        const { input, swatch } = mountField({ modelValue: '#336699' });
        expect(input().labels?.[0]?.textContent).toBe('Colour of the class');
        expect(input().value).toBe('#336699');
        expect(swatch().style.getPropertyValue('--vt-inputcolor-color')).toBe('#336699');
        expect(swatch().getAttribute('aria-label')).toBe('Choose colour');
    });

    it('writes a value given without # or in capitals the way it keeps them', () => {
        const { input } = mountField({ modelValue: '3366AA' });
        expect(input().value).toBe('#3366aa');
    });

    it('takes six digits as they are typed, with or without #', async () => {
        const { value, type } = mountField({ modelValue: null });
        await type('#33');
        expect(value.value).toBeNull();
        await type('aabbcc');
        expect(value.value).toBe('#aabbcc');
    });

    it('keeps a half-typed value in the box, and puts the colour back when the box is left', async () => {
        const { value, input, type } = mountField({ modelValue: '#336699' });
        await type('#12');
        expect(input().value).toBe('#12');
        expect(value.value).toBe('#336699');
        input().dispatchEvent(new FocusEvent('blur'));
        await nextTick();
        expect(input().value).toBe('#336699');
    });

    it('reads the short form when the box is left or Enter is pressed', async () => {
        const { value, input, type } = mountField({ modelValue: null });
        await type('f80');
        expect(value.value).toBeNull();
        await press(input(), 'Enter');
        expect(value.value).toBe('#ff8800');
        expect(input().value).toBe('#ff8800');
    });

    it('empties to null, from the box and from the clear button', async () => {
        const { value, type, cleared } = mountField({ modelValue: '#336699', clearable: true });
        await type('');
        expect(value.value).toBeNull();
        expect(cleared).toHaveLength(1);
        value.value = '#336699';
        await nextTick();
        document.querySelector<HTMLButtonElement>('button.vt-inputcolor-clear')!.click();
        await nextTick();
        expect(value.value).toBeNull();
    });

    it('opens the picker from the swatch, and a change there reaches the box', async () => {
        const { swatch, dialog, value, input } = mountField({ modelValue: '#336699' });
        expect(swatch().getAttribute('aria-expanded')).toBe('false');
        swatch().dispatchEvent(new MouseEvent('click', { detail: 0 }));
        await opened();
        expect(swatch().getAttribute('aria-expanded')).toBe('true');
        expect(swatch().getAttribute('aria-controls')).toBe(dialog()!.id);
        const hue = dialog()!.querySelector<HTMLElement>('[role="slider"][aria-label="Hue"]')!;
        await press(hue, 'Home');
        expect(value.value).toBe('#993333');
        expect(input().value).toBe('#993333');
    });

    it('goes into the panel with ArrowDown and back to the box with Escape', async () => {
        const { input, dialog } = mountField({ modelValue: '#336699' });
        input().focus();
        await press(input(), 'ArrowDown');
        await opened();
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Saturation and brightness');
        await press(document.activeElement!, 'Escape');
        await opened();
        expect(dialog()).toBeNull();
        expect(document.activeElement).toBe(input());
    });

    it('offers swatches, marking the one the value is', async () => {
        const { swatch, value } = mountField({ modelValue: '#336699', swatches: ['#336699', 'E53935', 'not a colour'] });
        swatch().click();
        await opened();
        const options = [...document.querySelectorAll<HTMLButtonElement>('.vt-inputcolor-option')];
        expect(options.map((o) => o.getAttribute('aria-label'))).toEqual(['#336699', '#e53935']);
        expect(options[0]!.getAttribute('aria-pressed')).toBe('true');
        options[1]!.click();
        await nextTick();
        expect(value.value).toBe('#e53935');
    });

    it('does not open or type while disabled or read only', async () => {
        const { swatch, dialog, input } = mountField({ modelValue: '#336699', readonly: true });
        expect(swatch().disabled).toBe(true);
        expect(input().readOnly).toBe(true);
        await press(input(), 'ArrowDown');
        await opened();
        expect(dialog()).toBeNull();
    });

    it('has no accessibility violations, closed and open', async () => {
        const { swatch } = mountField({ modelValue: '#336699', swatches: ['#e53935'] });
        await expectNoA11yViolations(document.body);
        swatch().click();
        await opened();
        await expectNoA11yViolations(document.body);
    });
});

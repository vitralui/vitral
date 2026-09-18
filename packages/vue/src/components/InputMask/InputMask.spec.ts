import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import InputMask from './InputMask.vue';

function mountMask(props: Record<string, unknown> = {}) {
    const value = ref<string | null | undefined>((props.modelValue as string | undefined) ?? '');
    const completed: string[] = [];
    const wrapper = mountVt(
        defineComponent(() => () => [
            h('label', { for: 'phone' }, 'Phone'),
            h(InputMask, {
                id: 'phone',
                mask: '(999) 999-9999',
                ...props,
                modelValue: value.value,
                'onUpdate:modelValue': (v: string | null | undefined) => (value.value = v),
                onComplete: (e: { value: string }) => completed.push(e.value)
            })
        ])
    );
    const input = () => document.querySelector<HTMLInputElement>('#phone')!;
    const type = async (text: string) => {
        for (const key of text) await press(input(), key);
    };
    return { wrapper, value, input, type, completed };
}

describe('InputMask', () => {
    it('is a labelled text box that shows the pattern once focused, with the caret on the first slot', async () => {
        const { input } = mountMask();
        expect(input().labels?.[0]?.textContent).toBe('Phone');
        expect(input().value).toBe('');
        expect(input().getAttribute('inputmode')).toBe('numeric');
        input().focus();
        await nextTick();
        await nextTick();
        expect(input().value).toBe('(___) ___-____');
        expect(input().selectionStart).toBe(1);
    });

    it('types into the slots, skips literals and refuses characters a slot does not take', async () => {
        const { input, type, value } = mountMask();
        input().focus();
        await nextTick();
        await type('55a5');
        expect(input().value).toBe('(555) ___-____');
        expect(value.value).toBe('(555) ___-____');
        expect(input().selectionStart).toBe(6);
    });

    it('deletes backwards and forwards, pulling what follows', async () => {
        const { input, type, value } = mountMask();
        input().focus();
        await nextTick();
        await type('1234');
        await press(input(), 'Backspace');
        expect(input().value).toBe('(123) ___-____');
        input().setSelectionRange(1, 1);
        await press(input(), 'Delete');
        expect(value.value).toBe('(23_) ___-____');
    });

    it('reports completion, and can hand over only the typed characters', async () => {
        const { input, type, value, completed } = mountMask({ unmask: true });
        input().focus();
        await nextTick();
        await type('5551234567');
        expect(value.value).toBe('5551234567');
        expect(completed).toEqual(['5551234567']);
        expect(input().value).toBe('(555) 123-4567');
    });

    it('spreads a paste across the slots', async () => {
        const { input, value } = mountMask();
        input().focus();
        await nextTick();
        const paste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
        Object.defineProperty(paste, 'clipboardData', { value: { getData: () => '555-123-4567' } });
        input().dispatchEvent(paste);
        await nextTick();
        expect(value.value).toBe('(555) 123-4567');
        expect(paste.defaultPrevented).toBe(true);
    });

    it('clears an unfinished value on blur unless told not to, and reads a value set from outside', async () => {
        const { input, type, value } = mountMask();
        input().focus();
        await nextTick();
        await type('12');
        input().blur();
        await nextTick();
        expect(value.value).toBe('');
        expect(input().value).toBe('');
        value.value = '9998887777';
        await nextTick();
        expect(input().value).toBe('(999) 888-7777');
        const kept = mountMask({ autoClear: false, mask: 'a9', id: 'other' });
        const other = document.querySelector<HTMLInputElement>('#other')!;
        other.focus();
        await nextTick();
        await press(other, 'x');
        other.blur();
        await nextTick();
        expect(kept.value.value).toBe('x_');
    });

    it('reads autofilled text through the same pattern', async () => {
        const { input, value } = mountMask();
        input().value = '555 123 4567';
        input().dispatchEvent(new Event('input'));
        await nextTick();
        expect(value.value).toBe('(555) 123-4567');
    });

    it('has no accessibility violations', async () => {
        const { input } = mountMask({ modelValue: '(555) 123-4567', invalid: true });
        expect(input().getAttribute('aria-invalid')).toBe('true');
        await expectNoA11yViolations();
    });
});

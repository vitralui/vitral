import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import InputOtp from './InputOtp.vue';

function mountOtp(props: Record<string, unknown> = {}) {
    const value = ref<string | null | undefined>((props.modelValue as string | undefined) ?? '');
    const completed: string[] = [];
    mountVt(
        defineComponent(() => () => [
            h('label', { for: 'code' }, 'Verification code'),
            h(InputOtp, {
                id: 'code',
                ...props,
                modelValue: value.value,
                'onUpdate:modelValue': (v: string | null | undefined) => (value.value = v),
                onComplete: (e: { value: string }) => completed.push(e.value)
            })
        ])
    );
    const group = () => document.querySelector<HTMLElement>('[role="group"]')!;
    const boxes = () => Array.from(document.querySelectorAll<HTMLInputElement>('[role="group"] input'));
    return { value, group, boxes, completed };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('InputOtp', () => {
    it('is a group named by the label, of boxes named by their position', async () => {
        const { group, boxes } = mountOtp({ length: 6 });
        await nextTick();
        expect(boxes()).toHaveLength(6);
        expect(boxes()[0]!.id).toBe('code');
        expect(document.getElementById(group().getAttribute('aria-labelledby')!)?.textContent).toBe('Verification code');
        expect(boxes()[1]!.getAttribute('aria-label')).toBe('Character 2 of 6');
        expect(boxes()[0]!.getAttribute('autocomplete')).toBe('one-time-code');
    });

    it('moves on as characters are typed and reports the finished code', async () => {
        const { boxes, value, completed } = mountOtp({ integerOnly: true });
        boxes()[0]!.focus();
        await press(boxes()[0]!, '1');
        await tick();
        expect(value.value).toBe('1');
        expect(document.activeElement).toBe(boxes()[1]);
        await press(boxes()[1]!, 'x');
        expect(value.value).toBe('1');
        for (const [i, key] of ['2', '3', '4'].entries()) {
            await press(boxes()[i + 1]!, key);
            await tick();
        }
        expect(value.value).toBe('1234');
        expect(completed).toEqual(['1234']);
        expect(boxes().map((b) => b.value)).toEqual(['1', '2', '3', '4']);
    });

    it('walks the boxes with the arrows, Home and End, and goes back on Backspace', async () => {
        const { boxes, value } = mountOtp({ modelValue: '12' });
        boxes()[0]!.focus();
        await press(boxes()[0]!, 'ArrowRight');
        expect(document.activeElement).toBe(boxes()[1]);
        await press(boxes()[1]!, 'End');
        expect(document.activeElement).toBe(boxes()[3]);
        await press(boxes()[3]!, 'Home');
        expect(document.activeElement).toBe(boxes()[0]);
        boxes()[2]!.focus();
        await press(boxes()[2]!, 'Backspace');
        await tick();
        expect(value.value).toBe('1');
        expect(document.activeElement).toBe(boxes()[1]);
        await press(boxes()[1]!, 'ArrowLeft');
        expect(document.activeElement).toBe(boxes()[0]);
    });

    it('spreads a paste or an autofilled code over the boxes', async () => {
        const { boxes, value } = mountOtp();
        const paste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
        Object.defineProperty(paste, 'clipboardData', { value: { getData: () => '98 76' } });
        boxes()[0]!.dispatchEvent(paste);
        await tick();
        expect(value.value).toBe('9876');
        value.value = '';
        await nextTick();
        boxes()[0]!.value = '5432';
        boxes()[0]!.dispatchEvent(new Event('input'));
        await tick();
        expect(value.value).toBe('5432');
    });

    it('changes nothing when read-only, and masks the characters on request', async () => {
        const { boxes, value } = mountOtp({ readonly: true, mask: true, modelValue: '1' });
        expect(boxes()[0]!.type).toBe('password');
        await press(boxes()[1]!, '5');
        expect(value.value).toBe('1');
    });

    it('has no accessibility violations', async () => {
        mountOtp({ modelValue: '12', invalid: true });
        await nextTick();
        await expectNoA11yViolations();
    });
});

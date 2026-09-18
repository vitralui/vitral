import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Password from './Password.vue';

function mountPassword(props: Record<string, unknown> = {}) {
    const value = ref<string | null | undefined>((props.modelValue as string | undefined) ?? '');
    const wrapper = mountVt(
        defineComponent(() => () => [
            h('label', { for: 'pw' }, 'Password'),
            h(Password, { id: 'pw', ...props, modelValue: value.value, 'onUpdate:modelValue': (v: string | null | undefined) => (value.value = v) })
        ])
    );
    const input = () => document.querySelector<HTMLInputElement>('#pw')!;
    const status = () => document.querySelector<HTMLElement>('[role="status"]');
    return { wrapper, value, input, status };
}

describe('Password', () => {
    it('is a labelled password box that binds v-model', async () => {
        const { input, value } = mountPassword();
        expect(input().type).toBe('password');
        expect(input().labels?.[0]?.textContent).toBe('Password');
        input().value = 'secret';
        input().dispatchEvent(new Event('input'));
        expect(value.value).toBe('secret');
    });

    it('reveals the text through a named button whose name follows its state', async () => {
        const { input } = mountPassword({ toggleMask: true, modelValue: 'secret' });
        const reveal = document.querySelector<HTMLButtonElement>('button')!;
        expect(reveal.getAttribute('aria-label')).toBe('Show password');
        reveal.click();
        await nextTick();
        expect(input().type).toBe('text');
        expect(reveal.getAttribute('aria-label')).toBe('Hide password');
        reveal.click();
        await nextTick();
        expect(input().type).toBe('password');
    });

    it('grades the password in a live region that describes the box while it has focus', async () => {
        const { input, status, value } = mountPassword();
        expect(status()).toBeNull();
        input().focus();
        await nextTick();
        expect(status()!.textContent).toBe('Enter a password');
        expect(input().getAttribute('aria-describedby')).toBe(status()!.id);
        value.value = 'abc';
        await nextTick();
        expect(status()!.textContent).toBe('Weak');
        expect(document.querySelector('.vt-password-meter-weak')).not.toBeNull();
        value.value = 'abc123';
        await nextTick();
        expect(status()!.textContent).toBe('Medium');
        value.value = 'Abcdef12';
        await nextTick();
        expect(status()!.textContent).toBe('Strong');
        input().blur();
        await nextTick();
        expect(status()).toBeNull();
        expect(input().hasAttribute('aria-describedby')).toBe(false);
    });

    it('keeps its own description and takes custom labels, or shows no meter at all', async () => {
        const { input, status } = mountPassword({ 'aria-describedby': 'hint', strongLabel: 'Great', modelValue: 'Abcdef12' });
        input().focus();
        await nextTick();
        expect(input().getAttribute('aria-describedby')).toBe(`hint ${status()!.id}`);
        expect(status()!.textContent).toBe('Great');
    });

    it('shows no meter when feedback is off', async () => {
        const { input, status } = mountPassword({ feedback: false });
        input().focus();
        await nextTick();
        expect(status()).toBeNull();
    });

    it('has no accessibility violations, closed or open', async () => {
        const { input } = mountPassword({ toggleMask: true, clearable: true, modelValue: 'abc' });
        await expectNoA11yViolations();
        input().focus();
        await nextTick();
        await expectNoA11yViolations();
    });
});

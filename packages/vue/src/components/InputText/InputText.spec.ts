import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import InputText from './InputText.vue';

describe('InputText', () => {
    it('binds v-model both ways', async () => {
        const value = ref('hello');
        const wrapper = mountVt(defineComponent(() => () => h(InputText, { modelValue: value.value, 'onUpdate:modelValue': (v: string | null | undefined) => (value.value = v ?? '') })));
        const input = wrapper.get('input');
        expect(input.element.value).toBe('hello');
        await input.setValue('world');
        expect(value.value).toBe('world');
    });

    it('sends class and style to the field and every other attribute to the input', () => {
        const wrapper = mountVt(InputText, { attrs: { id: 'name', placeholder: 'Name', class: 'wide', 'aria-describedby': 'hint' } });
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-field', 'vt-inputtext', 'wide']));
        const input = wrapper.get('input');
        expect(input.attributes()).toMatchObject({ id: 'name', placeholder: 'Name', 'aria-describedby': 'hint' });
        expect(wrapper.attributes('id')).toBeUndefined();
    });

    it('marks an invalid field for assistive technology', () => {
        const wrapper = mountVt(InputText, { props: { invalid: true } });
        expect(wrapper.classes()).toContain('vt-field-invalid');
        expect(wrapper.get('input').attributes('aria-invalid')).toBe('true');
    });

    it('takes its variant from the plugin unless it names one', () => {
        const filled = mountVt(InputText, {}, { theme: 'none', inputVariant: 'filled' });
        expect(filled.classes()).toContain('vt-field-filled');
        const outlined = mountVt(InputText, { props: { variant: 'outlined' } }, { theme: 'none', inputVariant: 'filled' });
        expect(outlined.classes()).not.toContain('vt-field-filled');
    });

    it('clears through a named button that does not steal a tab stop', async () => {
        const wrapper = mountVt(InputText, { props: { clearable: true, modelValue: 'abc' } });
        const clear = wrapper.get('button');
        expect(clear.attributes('aria-label')).toBe('Clear');
        expect(clear.attributes('tabindex')).toBe('-1');
        await clear.trigger('click');
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['']);
        expect(wrapper.emitted('clear')).toHaveLength(1);
        expect(document.activeElement).toBe(wrapper.get('input').element);
    });

    it('keeps room for the clear button while empty, so the field does not grow when a value arrives', async () => {
        const wrapper = mountVt(InputText, { props: { clearable: true, modelValue: '' } });
        const clear = wrapper.get('button');
        expect((clear.element as HTMLElement).style.visibility).toBe('hidden');
        await wrapper.setProps({ modelValue: 'abc' });
        expect((clear.element as HTMLElement).style.visibility).toBe('');
    });

    it('has no accessibility violations when labelled', async () => {
        const wrapper = mountVt(
            defineComponent(() => () => [h('label', { for: 'email' }, 'Email'), h(InputText, { id: 'email', clearable: true, modelValue: 'a@b.c' }, { prefix: () => '@' })])
        );
        expect(wrapper.find('input').exists()).toBe(true);
        await expectNoA11yViolations();
    });

    describe('with a mask', () => {
        function mountMasked(props: Record<string, unknown>) {
            const value = ref<string | null | undefined>((props.modelValue as string | undefined) ?? '');
            const completed: string[] = [];
            const wrapper = mountVt(
                defineComponent(() => () =>
                    h(InputText, {
                        id: 'doc',
                        ...props,
                        modelValue: value.value,
                        'onUpdate:modelValue': (v: string | null | undefined) => (value.value = v),
                        onComplete: (e: { value: string }) => completed.push(e.value)
                    })
                )
            );
            const input = () => document.querySelector<HTMLInputElement>('#doc')!;
            const type = async (text: string) => {
                for (const key of text) await press(input(), key);
            };
            return { wrapper, value, input, type, completed };
        }

        it('types into a mask as InputMask does', async () => {
            const { input, type, value, completed } = mountMasked({ mask: ['999.999.999-99', '99.999.999/9999-99'] });
            expect(input().getAttribute('inputmode')).toBe('numeric');
            input().focus();
            await nextTick();
            await type('12345678901');
            expect(input().value).toBe('123.456.789-01');
            expect(completed).toEqual(['123.456.789-01']);
            await type('234');
            expect(value.value).toBe('12.345.678/9012-34');
        });

        it('lets its own settings win over the mask object', async () => {
            const { input, type, value } = mountMasked({ mask: { pattern: '99999-999', unmask: true }, unmask: false });
            input().focus();
            await nextTick();
            await type('01310100');
            expect(value.value).toBe('01310-100');
        });

        it('turns letters to the mask case', async () => {
            const { input, type, value } = mountMasked({ mask: { pattern: (raw: string) => (/^[A-Za-z]{3}[0-9][A-Za-z]/.test(raw) ? 'aaa9a99' : 'aaa-9*99'), case: 'upper' }, unmask: true });
            input().focus();
            await nextTick();
            await type('abc1d23');
            expect(input().value).toBe('ABC1D23');
            expect(value.value).toBe('ABC1D23');
        });

        it('keeps the clear button and the slots', async () => {
            const { wrapper, input, value } = mountMasked({ mask: '99/99', clearable: true, modelValue: '1231' });
            await nextTick();
            expect(input().value).toBe('12/31');
            await wrapper.get('button').trigger('click');
            expect(value.value).toBe('');
            await nextTick();
            expect(input().value).toBe('__/__');
        });
    });
});
import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
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
});

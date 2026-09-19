import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Textarea from './Textarea.vue';

describe('Textarea', () => {
    it('binds v-model both ways, keeping line breaks', async () => {
        const value = ref('first line');
        const wrapper = mountVt(defineComponent(() => () => h(Textarea, { modelValue: value.value, 'onUpdate:modelValue': (v: string | null | undefined) => (value.value = v ?? '') })));
        const textarea = wrapper.get('textarea');
        expect(textarea.element.value).toBe('first line');
        await textarea.setValue('one\ntwo');
        expect(value.value).toBe('one\ntwo');
        value.value = 'from outside';
        await nextTick();
        expect(textarea.element.value).toBe('from outside');
    });

    it('sends class and style to the field and every other attribute to the textarea', () => {
        const wrapper = mountVt(Textarea, { attrs: { id: 'bio', placeholder: 'About you', maxlength: '200', class: 'wide', 'aria-describedby': 'hint' } });
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-field', 'vt-textarea', 'wide']));
        expect(wrapper.get('textarea').attributes()).toMatchObject({ id: 'bio', placeholder: 'About you', maxlength: '200', 'aria-describedby': 'hint' });
        expect(wrapper.attributes('id')).toBeUndefined();
    });

    it('shows three rows unless told otherwise', () => {
        expect(mountVt(Textarea).get('textarea').attributes('rows')).toBe('3');
        expect(mountVt(Textarea, { props: { rows: 6 } }).get('textarea').attributes('rows')).toBe('6');
    });

    it('grows with its content when it resizes itself', async () => {
        const wrapper = mountVt(Textarea, { props: { autoResize: true } });
        const textarea = wrapper.get('textarea');
        expect(wrapper.classes()).toContain('vt-textarea-auto-resize');
        Object.defineProperty(textarea.element, 'scrollHeight', { configurable: true, get: () => 132 });
        await textarea.setValue('a\nb\nc\nd\ne\nf');
        expect(textarea.element.style.height).toBe('132px');
    });

    it('leaves the height alone when it does not', async () => {
        const wrapper = mountVt(Textarea);
        const textarea = wrapper.get('textarea');
        Object.defineProperty(textarea.element, 'scrollHeight', { configurable: true, get: () => 132 });
        await textarea.setValue('a\nb\nc');
        expect(textarea.element.style.height).toBe('');
    });

    it('reflects its states on the native control and for assistive technology', () => {
        const wrapper = mountVt(Textarea, { props: { invalid: true, readonly: true, size: 'small' } });
        const textarea = wrapper.get('textarea');
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-field-invalid', 'vt-field-readonly', 'vt-field-sm']));
        expect(textarea.attributes('aria-invalid')).toBe('true');
        expect(textarea.attributes('readonly')).toBeDefined();
        const disabled = mountVt(Textarea, { props: { disabled: true } });
        expect(disabled.get('textarea').attributes('disabled')).toBeDefined();
        expect(disabled.classes()).toContain('vt-field-disabled');
    });

    it('takes its variant from the plugin unless it names one', () => {
        expect(mountVt(Textarea, {}, { theme: 'none', inputVariant: 'filled' }).classes()).toContain('vt-field-filled');
        expect(mountVt(Textarea, { props: { variant: 'outlined' } }, { theme: 'none', inputVariant: 'filled' }).classes()).not.toContain('vt-field-filled');
    });

    it('is reachable by Tab and focuses its text on a press of the padding', async () => {
        const wrapper = mountVt(Textarea);
        const textarea = wrapper.get('textarea').element;
        expect(textarea.tabIndex).toBe(0);
        await wrapper.trigger('pointerdown', { pointerType: 'mouse' });
        expect(document.activeElement).toBe(textarea);
    });

    it('lets a tap on the padding through, since preventing it would cancel the tap', async () => {
        const wrapper = mountVt(Textarea);
        const mouse = new PointerEvent('pointerdown', { pointerType: 'mouse', bubbles: true, cancelable: true });
        wrapper.element.dispatchEvent(mouse);
        expect(mouse.defaultPrevented).toBe(true);
        const finger = new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true, cancelable: true });
        wrapper.element.dispatchEvent(finger);
        expect(finger.defaultPrevented).toBe(false);
        // Either way the text takes the keyboard.
        expect(document.activeElement).toBe(wrapper.get('textarea').element);
    });

    it('has no accessibility violations when labelled', async () => {
        mountVt(defineComponent(() => () => [h('label', { for: 'notes' }, 'Notes'), h(Textarea, { id: 'notes', modelValue: 'Some text', autoResize: true })]));
        mountVt(Textarea, { props: { disabled: true }, attrs: { 'aria-label': 'Disabled notes' } });
        await expectNoA11yViolations();
    });
});

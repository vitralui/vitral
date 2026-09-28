import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Editor from './Editor.vue';

afterEach(() => {
    document.body.innerHTML = '';
});

describe('Editor find and replace', () => {
    it('opens under the toolbar on Ctrl+F, and replaces through the model', async () => {
        const wrapper = mountVt(Editor, { props: { modelValue: '<p>one cat, two cats</p>', 'aria-label': 'Notes', toolbar: [['bold', 'find']] }, attachTo: document.body });
        await nextTick();
        wrapper.get('[role="textbox"]').element.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', code: 'KeyH', ctrlKey: true, bubbles: true, cancelable: true }));
        await nextTick();
        const bar = wrapper.get('[role="search"]');
        expect(bar.element.parentElement!.previousElementSibling?.getAttribute('role')).toBe('toolbar');
        const [query, replacement] = bar.findAll('input');
        await query!.setValue('cat');
        expect(bar.get('.vt-editor-find-count').text()).toBe('1 of 2');
        await replacement!.setValue('dog');
        bar.findAll('button').find((b) => b.text() === 'Replace all')!.trigger('click');
        await nextTick();
        expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['<p>one dog, two dogs</p>']);
        await expectNoA11yViolations(wrapper.element as HTMLElement);
        wrapper.unmount();
    });

    it('opens from its toolbar button and not from the keys when turned off', async () => {
        const wrapper = mountVt(Editor, { props: { modelValue: '<p>x</p>', 'aria-label': 'Notes', toolbar: [['find']], find: false }, attachTo: document.body });
        await nextTick();
        wrapper.get('[role="textbox"]').element.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', ctrlKey: true, bubbles: true, cancelable: true }));
        await nextTick();
        expect(wrapper.find('[role="search"]').exists()).toBe(false);
        await wrapper.get('button[aria-label="Find"]').trigger('click');
        expect(wrapper.find('[role="search"]').exists()).toBe(true);
        wrapper.unmount();
    });
});

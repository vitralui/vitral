import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mountVt } from '../../../test/utils';
import Editor from './Editor.vue';

afterEach(() => {
    document.body.innerHTML = '';
});

describe('Editor chips', () => {
    it('offers and puts in chips from a trigger, drawn with the theme’s classes', async () => {
        const wrapper = mountVt(Editor, {
            props: {
                modelValue: '<p></p>',
                'aria-label': 'Notes',
                chips: { char: '@', kind: 'mention', items: (q: string) => [{ id: 'u1', label: 'Ana Souza' }].filter((p) => p.label.toLowerCase().startsWith(q.toLowerCase())) }
            }
        });
        await nextTick();
        const editor = (wrapper.vm as unknown as { editor: { typeText: (t: string) => void; getHTML: () => string } }).editor;
        for (const c of '@an') editor.typeText(c);
        await nextTick();
        expect(document.querySelectorAll('[role="option"]')).toHaveLength(1);
        const content = wrapper.get('[role="textbox"]').element;
        content.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        await nextTick();
        expect(editor.getHTML()).toContain('data-chip="u1" data-kind="mention"');
        expect(wrapper.find('.vt-editor-chip.vt-editor-chip-mention').exists()).toBe(true);
    });
});

import { loadMath } from '@vitral/core';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Editor from './Editor.vue';

afterEach(() => {
    document.body.innerHTML = '';
});

beforeAll(() => loadMath());

const CONTENT = '<p>Area: <span data-math="\\frac{b h}{2}"></span></p>';
const panel = () => document.querySelector<HTMLElement>('.vt-editor-math-panel');
const box = () => document.querySelector<HTMLInputElement>('.vt-editor-math-input');
const click = (target: Element) => target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

async function mount(props: Record<string, unknown> = {}) {
    const wrapper = mountVt(Editor, { props: { modelValue: CONTENT, 'aria-label': 'Notes', ...props } });
    await nextTick();
    await nextTick();
    const content = wrapper.get('[role="textbox"]').element as HTMLElement;
    const formula = () => content.querySelector<HTMLElement>('[data-math]')!;
    const button = () => wrapper.find('[role="toolbar"] button[aria-label="Formula"]');
    return { wrapper, content, formula, button };
}

describe('Editor formulas', () => {
    it('draws a formula with the theme’s classes and edits a value where it stands, the model following', async () => {
        const { wrapper, content, formula, button } = await mount();
        expect(formula().classList.contains('vt-editor-math')).toBe(true);
        expect(formula().querySelector('svg')!.getAttribute('aria-label')).toBe('\\frac{b h}{2}');
        expect(content.getAttribute('data-math-edit')).toBe('inline');
        expect(button().attributes('aria-pressed')).toBe('false');

        click(formula().querySelector('[data-at="11,12"] > rect')!);
        expect(box()!.value).toBe('2');
        box()!.value = '3';
        box()!.dispatchEvent(new Event('input', { bubbles: true }));
        box()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        await nextTick();
        expect(box()).toBeNull();
        const html = wrapper.emitted('update:modelValue')!.at(-1)![0] as string;
        // The model is the HTML: the source, around the drawing of it.
        expect(html).toContain('data-math="\\frac{b h}{3}"');
        expect(html).toMatch(/<svg style="vertical-align:-[\d.]+em"/);
    });

    it('opens the panel from the toolbar, and has no accessibility violations with it open', async () => {
        const { wrapper, button } = await mount({ modelValue: '<p></p>' });
        await expectNoA11yViolations();
        await button().trigger('click');
        expect(panel()!.getAttribute('aria-label')).toBe('Formula');
        await expectNoA11yViolations();
        const source = panel()!.querySelector<HTMLInputElement>('input[type="text"]')!;
        source.value = 'x^2';
        source.dispatchEvent(new Event('input', { bubbles: true }));
        source.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        await nextTick();
        expect(panel()).toBeNull();
        expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toContain('data-math="x^2"');
        expect(button().attributes('aria-pressed')).toBe('true');
    });

    it('takes its own ready-made formulas, and opens the panel for a value when inlineEdit is off', async () => {
        const { content, formula } = await mount({ math: { templates: [{ id: 'half', label: 'A half', latex: '\\frac{1}{2}' }], inlineEdit: false } });
        expect(content.getAttribute('data-math-edit')).toBe('panel');
        click(formula().querySelector('[data-at="11,12"] > rect')!);
        expect(box()).toBeNull();
        expect(Array.from(panel()!.querySelectorAll('.vt-editor-math-template')).map((b) => b.getAttribute('aria-label'))).toEqual(['A half']);
    });

    it('writes the model with the source alone when output says so, and hands over either on request', async () => {
        const { wrapper } = await mount({ math: { output: 'source' } });
        const vm = wrapper.vm as unknown as { editor: { run: (name: string, ...args: unknown[]) => boolean }; getHTML: (options?: { math?: 'drawing' | 'source' }) => string };
        vm.editor.run('insertMath', { latex: 'x^2' });
        await nextTick();
        const html = wrapper.emitted('update:modelValue')!.at(-1)![0] as string;
        expect(html).toContain('<span data-math="x^2" contenteditable="false">x^2</span>');
        expect(html).not.toContain('<svg');
        expect(vm.getHTML()).toBe(html);
        expect(vm.getHTML({ math: 'drawing' })).toContain('<svg style="vertical-align');
        // In the text it is drawn all the same.
        expect(wrapper.findAll('[data-math] svg').length).toBe(2);
        await wrapper.setProps({ math: true });
        expect(vm.getHTML()).toContain('<svg');
    });

    it('draws formulas and offers nothing to change them with when math is false', async () => {
        const { content, formula, button, wrapper } = await mount({ math: false });
        expect(formula().querySelector('svg')).not.toBeNull();
        expect(button().exists()).toBe(false);
        expect(content.hasAttribute('data-math-edit')).toBe(false);
        click(formula().querySelector('[data-leaf] > rect')!);
        expect(box()).toBeNull();
        expect(panel()).toBeNull();
        // Back on, the button is back.
        await wrapper.setProps({ math: true });
        expect(wrapper.find('[role="toolbar"] button[aria-label="Formula"]').exists()).toBe(true);
        expect(content.getAttribute('data-math-edit')).toBe('inline');
    });

    it('shuts the panel when the text becomes read-only', async () => {
        const { formula, wrapper } = await mount();
        click(formula());
        expect(panel()).not.toBeNull();
        await wrapper.setProps({ readonly: true });
        expect(panel()).toBeNull();
    });
});

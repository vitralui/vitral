import { loadMath } from '@vitral/core';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../vue/test/a11y';
import { createTextEditor } from './editor';
import type { TextEditorHandle } from './types';

let handle: TextEditorHandle | null = null;
afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

// The renderer arrives on its own in a page; the specs wait for it once, so
// every formula here is a drawing from the start.
beforeAll(() => loadMath());

const QUADRATIC = 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}';

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    handle = createTextEditor(element, { content: `<p>Roots: <span data-math="${QUADRATIC}"></span> always.</p>`, ariaLabel: 'Notes', ...config });
    const content = () => element.querySelector<HTMLElement>('[role="textbox"]')!;
    const formula = (index = 0) => content().querySelectorAll<HTMLElement>('[data-math]')[index]!;
    const piece = (at: string, index = 0) => formula(index).querySelector<SVGElement>(`[data-at="${at}"] > rect`)!;
    const click = (target: Element) => target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    const button = () => element.querySelector<HTMLButtonElement>('[role="toolbar"] button[aria-label="Formula"]');
    return { element, content, formula, piece, click, button };
}

const panel = () => document.querySelector<HTMLElement>('.vt-editor-math-panel');
const source = () => panel()!.querySelector<HTMLInputElement>('input[type="text"]')!;
const box = () => document.querySelector<HTMLInputElement>('.vt-editor-math-input');
const named = (name: string) => Array.from(panel()!.querySelectorAll('button')).find((b) => (b.getAttribute('aria-label') ?? b.textContent) === name)!;
const write = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
};
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
const formulas = () => (handle!.getJSON().content ?? []).flatMap((block) => (block.content ?? []).filter((node) => node.type === 'math').map((node) => node.attrs?.latex));
const four = QUADRATIC.indexOf('4ac');

describe('formulas in the editor', () => {
    it('draws a formula in the text, and says on the text how a press on one is answered', () => {
        const { formula, content, button } = mount();
        expect(formula().className).toBe('vt-editor-math');
        expect(formula().querySelector('svg')!.getAttribute('aria-label')).toBe(QUADRATIC);
        expect(content().getAttribute('data-math-edit')).toBe('inline');
        expect(button()!.getAttribute('aria-haspopup')).toBe('dialog');
        expect(button()!.getAttribute('aria-pressed')).toBe('false');
    });

    it('edits a value where it stands: the formula follows the typing, and Enter keeps it as one change', () => {
        const { piece, click, formula } = mount();
        click(piece(`${four},${four + 1}`));
        expect(box()!.value).toBe('4');
        expect(box()!.getAttribute('aria-label')).toBe('Value in the formula');
        expect(document.activeElement).toBe(box());
        expect(formula().hasAttribute('data-editing')).toBe(true);
        write(box()!, '12');
        // Drawn from what the source would be; the document has not been touched yet.
        expect(formula().querySelector('svg')!.getAttribute('aria-label')).toBe(QUADRATIC.replace('4ac', '12ac'));
        expect(formulas()).toEqual([QUADRATIC]);
        key(box()!, 'Enter');
        expect(box()).toBeNull();
        expect(formulas()).toEqual([QUADRATIC.replace('4ac', '12ac')]);
        expect(handle!.run('undo')).toBe(true);
        expect(formulas()).toEqual([QUADRATIC]);
        expect(handle!.can('undo')).toBe(false);
    });

    it('puts a value back on Escape, and goes to the next one on Tab', () => {
        const { piece, click, formula } = mount();
        click(piece(`${four},${four + 1}`));
        write(box()!, '999');
        key(box()!, 'Escape');
        expect(box()).toBeNull();
        expect(formulas()).toEqual([QUADRATIC]);
        expect(formula().querySelector('svg')!.getAttribute('aria-label')).toBe(QUADRATIC);

        click(piece(`${four},${four + 1}`));
        write(box()!, '8');
        key(box()!, 'Tab');
        expect(formulas()).toEqual([QUADRATIC.replace('4ac', '8ac')]);
        // The a after the 8.
        expect(box()!.value).toBe('a');
        key(box()!, 'Tab', { shiftKey: true });
        expect(box()!.value).toBe('8');
        key(box()!, 'Escape');
    });

    it('draws what it cannot read where it stands, and keeps the rest', () => {
        const { piece, click, formula } = mount();
        click(piece(`${four},${four + 1}`));
        write(box()!, '\\nope{');
        key(box()!, 'Enter');
        expect(formulas()).toEqual([QUADRATIC.replace('4ac', '\\nope{ac')]);
        // Still a drawing, with the slip marked in it.
        expect(formula().querySelector('svg .vt-math-error')).not.toBeNull();
        expect(formula().querySelectorAll('svg path').length).toBeGreaterThan(5);
    });

    it('opens the panel for a press that is not on a value, with that piece of the source selected', () => {
        const { formula, click } = mount();
        const fraction = formula().querySelector<SVGElement>('[data-at="4,38"] > rect')!;
        click(fraction);
        expect(box()).toBeNull();
        expect(panel()!.getAttribute('role')).toBe('dialog');
        expect(panel()!.getAttribute('aria-label')).toBe('Formula');
        expect(source().value).toBe(QUADRATIC);
        expect(document.activeElement).toBe(source());
        expect(source().value.slice(source().selectionStart!, source().selectionEnd!)).toBe(QUADRATIC.slice(4));
        // The formula, drawn above its source, and the usual ones ready-made.
        expect(panel()!.querySelector('.vt-editor-math-preview svg')!.getAttribute('aria-label')).toBe(QUADRATIC);
        expect(panel()!.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe('Common formulas');
        expect(panel()!.querySelectorAll('.vt-editor-math-template svg')).toHaveLength(22);
    });

    it('applies what the panel holds, removes a formula, and leaves it alone on Cancel', () => {
        const { formula, click } = mount();
        click(formula());
        write(source(), 'E = mc^2');
        expect(panel()!.querySelector('.vt-editor-math-preview svg')!.getAttribute('aria-label')).toBe('E = mc^2');
        named('Cancel').click();
        expect(panel()).toBeNull();
        expect(formulas()).toEqual([QUADRATIC]);

        click(formula());
        write(source(), 'E = mc^2');
        key(source(), 'Enter');
        expect(panel()).toBeNull();
        expect(formulas()).toEqual(['E = mc^2']);

        click(formula());
        named('Remove formula').click();
        expect(formulas()).toEqual([]);
        expect(handle!.getText()).toBe('Roots:  always.');
    });

    it('writes a new formula from the toolbar, with the ready-made ones put in where the caret is', () => {
        const { button } = mount({ content: '<p>Area: </p>' });
        handle!.run('setSelection', { anchor: { path: [0], offset: 6 }, head: { path: [0], offset: 6 } });
        button()!.click();
        expect(source().value).toBe('');
        expect(panel()!.querySelector('.vt-editor-math-preview')!.textContent).toBe('Type a formula, or choose one below');
        expect(named('Remove formula')).toBeUndefined();
        named('Pi').click();
        // A letter after a command would run into it: a space is put between them.
        named('Power').click();
        expect(source().value).toBe('\\pi x^{2}');
        source().setSelectionRange(4, 5);
        named('Fraction').click();
        expect(source().value).toBe('\\pi \\frac{a}{b}^{2}');
        write(source(), '\\pi r^2');
        named('Insert').click();
        expect(formulas()).toEqual(['\\pi r^2']);
        expect(handle!.getJSON().content![0]!.content![1]).toEqual({ type: 'math', attrs: { latex: '\\pi r^2', display: false } });
        // The caret is right after it, which is being on it: the button is down, and opens that one.
        expect(button()!.getAttribute('aria-pressed')).toBe('true');
        button()!.click();
        expect(source().value).toBe('\\pi r^2');
        panel()!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
        named('Apply').click();
        expect(handle!.getJSON().content![0]!.content![1]!.attrs).toEqual({ latex: '\\pi r^2', display: true });
        // Nothing written is nothing put in.
        handle!.run('setSelection', { anchor: { path: [0], offset: 0 }, head: { path: [0], offset: 0 } });
        button()!.click();
        named('Insert').click();
        expect(formulas()).toEqual(['\\pi r^2']);
    });

    it('is offered by the slash menu, which opens the panel where the caret was', () => {
        const { content } = mount({ content: '<p></p>' });
        for (const char of '/formu') handle!.typeText(char);
        expect(Array.from(document.querySelectorAll('[role="option"]')).map((o) => o.textContent)).toEqual(['FormulaA formula, drawn: a fraction, a root, a sum']);
        key(content(), 'Enter');
        write(source(), '\\sqrt{2}');
        key(source(), 'Enter');
        expect(formulas()).toEqual(['\\sqrt{2}']);
        expect(handle!.getText()).toBe('\\sqrt{2}');
    });

    it('takes the ready-made formulas it is given, and opens the panel for a value when it is told to', () => {
        const { piece, click, content } = mount({ math: { templates: [{ id: 'water', label: 'Water', latex: 'H_2O' }], inlineEdit: false } });
        expect(content().getAttribute('data-math-edit')).toBe('panel');
        click(piece(`${four},${four + 1}`));
        expect(box()).toBeNull();
        expect(source().value.slice(source().selectionStart!, source().selectionEnd!)).toBe('4');
        expect(Array.from(panel()!.querySelectorAll('.vt-editor-math-template')).map((b) => b.getAttribute('aria-label'))).toEqual(['Water']);
        named('Cancel').click();
        handle!.update({ math: { templates: [] } });
        click(piece(`${four},${four + 1}`));
        key(box()!, 'Escape');
        click(document.querySelector('[data-math]')!);
        expect(panel()!.querySelector('[role="group"]')).toBeNull();
    });

    it('hands its HTML back with the drawings, or with the source alone where it is told to', () => {
        mount();
        expect(handle!.getHTML()).toMatch(/data-math="[^"]+" contenteditable="false"><svg style="vertical-align/);
        const lean = handle!.getHTML({ math: 'source' });
        expect(lean).toBe(`<p>Roots: <span data-math="${QUADRATIC}" contenteditable="false">${QUADRATIC}</span> always.</p>`);
        handle!.update({ math: { output: 'source' } });
        expect(handle!.getHTML()).toBe(lean);
        let heard = '';
        handle!.update({ on: { change: ({ html }) => (heard = html) } });
        handle!.run('insertMath', { latex: 'x' });
        expect(heard).not.toContain('<svg');
        expect(heard).toContain('data-math="x"');
    });

    it('still draws formulas when they are switched off, and offers no way to make or change one', () => {
        const { formula, piece, click, button, content } = mount({ math: false });
        expect(formula().querySelector('svg')).not.toBeNull();
        expect(button()).toBeNull();
        expect(content().hasAttribute('data-math-edit')).toBe(false);
        click(piece(`${four},${four + 1}`));
        expect(box()).toBeNull();
        expect(panel()).toBeNull();
        for (const char of ' /form') handle!.typeText(char);
        expect(document.querySelector('[role="option"]')).toBeNull();
        // From code it is still a document like any other.
        expect(handle!.run('insertMath', { latex: 'x' })).toBe(true);
    });

    it('does nothing to a formula while the text is read-only', () => {
        const { piece, click, button } = mount({ readonly: true });
        click(piece(`${four},${four + 1}`));
        expect(box()).toBeNull();
        expect(panel()).toBeNull();
        expect(button()!.disabled).toBe(true);
    });

    it('closes what it had open when the formula under it goes', async () => {
        const { formula, click } = mount();
        click(formula());
        expect(panel()).not.toBeNull();
        handle!.setContent('<p>Nothing here.</p>');
        await Promise.resolve();
        expect(panel()).toBeNull();
    });

    it('has no accessibility violations: in the text, with the panel open, and over a value', async () => {
        const { formula, piece, click } = mount();
        await expectNoA11yViolations();
        click(formula());
        await expectNoA11yViolations();
        named('Cancel').click();
        click(piece(`${four},${four + 1}`));
        await expectNoA11yViolations();
        key(box()!, 'Escape');
    });
});

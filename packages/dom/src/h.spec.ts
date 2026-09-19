import { describe, expect, it } from 'vitest';
import { createRoot, h } from './h';

// The patcher on its own: what it puts on an element, and what it puts back.

describe('the keyed patcher', () => {
    it('keeps the element it already has, so what is in it survives', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        root.render(h('input', { key: 'a', type: 'text' }), h('span', { key: 'b' }, 'one'));
        const input = host.querySelector('input')!;
        input.focus();
        root.render(h('input', { key: 'a', type: 'text' }), h('span', { key: 'b' }, 'two'));
        expect(host.querySelector('input')).toBe(input);
        expect(document.activeElement).toBe(input);
        expect(host.querySelector('span')!.textContent).toBe('two');
        host.remove();
    });

    it('puts what a field holds on the field, not in an attribute', () => {
        const host = document.createElement('div');
        const root = createRoot(host);
        root.render(h('input', { key: 'a', value: 'first' }));
        const input = host.querySelector('input')!;
        expect(input.value).toBe('first');

        // Once a person has typed, the attribute no longer reaches the field:
        // a component that draws its own value has to put it back.
        input.value = 'typed over';
        root.render(h('input', { key: 'a', value: 'first' }));
        expect(input.value).toBe('first');
        root.render(h('input', { key: 'a', value: 'second' }));
        expect(input.value).toBe('second');
        root.render(h('input', { key: 'a', value: null }));
        expect(input.value).toBe('');
    });

    it('does the same for a box that is ticked', () => {
        const host = document.createElement('div');
        const root = createRoot(host);
        root.render(h('input', { key: 'a', type: 'checkbox', checked: true }));
        const box = host.querySelector('input')!;
        expect(box.checked).toBe(true);
        box.checked = false;
        root.render(h('input', { key: 'a', type: 'checkbox', checked: true }));
        expect(box.checked).toBe(true);
        root.render(h('input', { key: 'a', type: 'checkbox', checked: false }));
        expect(box.checked).toBe(false);
    });

    it('leaves `value` alone where it is not a field', () => {
        const host = document.createElement('div');
        createRoot(host).render(h('li', { key: 'a', value: 3 }, 'three'));
        expect(host.querySelector('li')!.getAttribute('value')).toBe('3');
    });

    it('takes back everything it put on the element it was given', () => {
        const host = document.createElement('div');
        const root = createRoot(host);
        root.attrs({ class: 'vt-thing', 'aria-label': 'Thing' });
        root.render(h('span', { key: 'a' }, 'in it'));
        expect(host.className).toBe('vt-thing');
        root.clear();
        expect(host.innerHTML).toBe('');
        expect(host.getAttribute('aria-label')).toBeNull();
    });
});

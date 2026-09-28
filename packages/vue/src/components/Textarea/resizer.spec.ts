import { afterEach, describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Textarea from './Textarea.vue';

const pointer = (type: string, init: PointerEventInit) => new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button: 0, isPrimary: true, pointerType: 'mouse', ...init });

afterEach(() => {
    document.body.innerHTML = '';
});

describe('the Textarea grip', () => {
    it("is the library's own, in place of the browser's", () => {
        const wrapper = mountVt(Textarea);
        const grip = wrapper.find('.vt-textarea-resizer');
        expect(grip.exists()).toBe(true);
        expect(grip.attributes('aria-hidden')).toBe('true');
        expect(grip.classes()).toContain('vt-textarea-resizer-vertical');
        expect(grip.find('svg').exists()).toBe(true);
    });

    it('goes when the box sizes itself, is disabled, or is told not to resize', () => {
        expect(mountVt(Textarea, { props: { autoResize: true } }).find('.vt-textarea-resizer').exists()).toBe(false);
        expect(mountVt(Textarea, { props: { disabled: true } }).find('.vt-textarea-resizer').exists()).toBe(false);
        expect(mountVt(Textarea, { props: { resize: 'none' } }).find('.vt-textarea-resizer').exists()).toBe(false);
        expect(mountVt(Textarea, { props: { resize: 'both' } }).find('.vt-textarea-resizer').classes()).toContain('vt-textarea-resizer-both');
    });

    it('drags the height, never below the floor, without taking the focus', async () => {
        const wrapper = mountVt(Textarea);
        const input = wrapper.get('textarea').element as HTMLTextAreaElement;
        Object.defineProperty(input, 'offsetHeight', { value: 80, configurable: true });
        input.style.minHeight = '36px';
        const grip = wrapper.get('.vt-textarea-resizer').element;
        grip.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100 }));
        document.dispatchEvent(pointer('pointermove', { clientX: 100, clientY: 140 }));
        await wrapper.vm.$nextTick();
        expect(input.style.height).toBe('120px');
        expect(wrapper.classes()).toContain('vt-textarea-resizing');
        document.dispatchEvent(pointer('pointermove', { clientX: 100, clientY: -200 }));
        expect(input.style.height).toBe('36px');
        document.dispatchEvent(pointer('pointerup', { clientX: 100, clientY: -200 }));
        expect(document.activeElement).not.toBe(input);
    });

    it('has no accessibility violations', async () => {
        mountVt(Textarea, { attrs: { 'aria-label': 'Notes' } });
        await expectNoA11yViolations();
    });
});

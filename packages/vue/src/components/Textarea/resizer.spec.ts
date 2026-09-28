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
        // Diagonally by default, which is what the corner grip promises.
        expect(grip.classes()).toContain('vt-textarea-resizer-both');
        expect(grip.find('svg').exists()).toBe(true);
    });

    it('keeps to its height when it fills its container', () => {
        expect(mountVt(Textarea, { props: { fluid: true } }).find('.vt-textarea-resizer').classes()).toContain('vt-textarea-resizer-vertical');
        expect(mountVt(Textarea, { props: { fluid: true, resize: 'both' } }).find('.vt-textarea-resizer').classes()).toContain('vt-textarea-resizer-both');
    });

    it('keeps the size it was dragged to while text is typed into it', async () => {
        const wrapper = mountVt(Textarea, { props: { resize: 'vertical' } });
        const input = wrapper.get('textarea').element as HTMLTextAreaElement;
        Object.defineProperty(input, 'offsetHeight', { value: 80, configurable: true });
        const grip = wrapper.get('.vt-textarea-resizer').element;
        grip.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100 }));
        document.dispatchEvent(pointer('pointermove', { clientX: 100, clientY: 150 }));
        document.dispatchEvent(pointer('pointerup', { clientX: 100, clientY: 150 }));
        expect(input.style.height).toBe('130px');
        await wrapper.get('textarea').setValue('a line\nand another');
        await wrapper.vm.$nextTick();
        expect(input.style.height).toBe('130px');
    });

    it('drags diagonally, the width along with the height', () => {
        const wrapper = mountVt(Textarea);
        const input = wrapper.get('textarea').element as HTMLTextAreaElement;
        const root = wrapper.element as HTMLElement;
        Object.defineProperty(input, 'offsetHeight', { value: 80, configurable: true });
        Object.defineProperty(root, 'offsetWidth', { value: 300, configurable: true });
        const grip = wrapper.get('.vt-textarea-resizer').element;
        grip.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100 }));
        document.dispatchEvent(pointer('pointermove', { clientX: 160, clientY: 120 }));
        document.dispatchEvent(pointer('pointerup', { clientX: 160, clientY: 120 }));
        expect(input.style.height).toBe('100px');
        expect(root.style.width).toBe('360px');
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

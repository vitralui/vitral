import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Image from './Image.vue';

function mountImage(props: Record<string, unknown> = {}) {
    const wrapper = mountVt(Image, { props: { src: 'lake.jpg', alt: 'A lake at dawn', ...props }, attrs: { class: 'photo', loading: 'lazy' } });
    const trigger = () => document.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]');
    const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
    const action = (label: string) => document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
    const preview = () => dialog()!.querySelector<HTMLImageElement>('img')!;
    return { wrapper, trigger, dialog, action, preview };
}

describe('Image', () => {
    it('is a plain image with its alternative text, taking the attributes', () => {
        const { wrapper, trigger } = mountImage();
        const img = wrapper.find('img');
        expect(img.attributes()).toMatchObject({ alt: 'A lake at dawn', loading: 'lazy' });
        expect(wrapper.classes()).toContain('photo');
        expect(trigger()).toBeNull();
    });

    it('opens a named modal viewer from a button, and gives focus back on Escape', async () => {
        const { trigger, dialog, wrapper } = mountImage({ preview: true, previewSrc: 'lake-large.jpg' });
        expect(trigger()!.getAttribute('aria-label')).toBe('View image: A lake at dawn');
        expect(trigger()!.querySelector('img')!.getAttribute('alt')).toBe('');
        trigger()!.focus();
        trigger()!.click();
        await nextTick();
        await nextTick();
        expect(dialog()!.getAttribute('aria-modal')).toBe('true');
        expect(dialog()!.getAttribute('aria-label')).toBe('A lake at dawn');
        expect(dialog()!.querySelector('img')!.getAttribute('src')).toBe('lake-large.jpg');
        expect(dialog()!.contains(document.activeElement)).toBe(true);
        await press(document.activeElement!, 'Escape');
        await nextTick();
        expect(dialog()).toBeNull();
        expect(document.activeElement).toBe(trigger());
        expect(wrapper.emitted('hide')).toHaveLength(1);
    });

    it('zooms and rotates from the toolbar and the keys, within its limits', async () => {
        const { trigger, action, preview, dialog } = mountImage({ preview: true, maxZoom: 1.5 });
        trigger()!.click();
        await nextTick();
        action('Zoom in').click();
        await nextTick();
        expect(preview().style.transform).toBe('translate(0px, 0px) rotate(0deg) scale(1.25)');
        await press(dialog()!, '+');
        expect(preview().style.transform).toBe('translate(0px, 0px) rotate(0deg) scale(1.5)');
        expect(action('Zoom in').disabled).toBe(true);
        action('Rotate right').click();
        await press(dialog()!, 'r', { shiftKey: true });
        await press(dialog()!, 'r', { shiftKey: true });
        expect(preview().style.transform).toBe('translate(0px, 0px) rotate(-90deg) scale(1.5)');
        await press(dialog()!, '-');
        expect(preview().style.transform).toBe('translate(0px, 0px) rotate(-90deg) scale(1.25)');
        action('Close').click();
        await nextTick();
        expect(dialog()).toBeNull();
    });

    it('pans a zoomed image by dragging and with the arrows, back to centre when zoomed out', async () => {
        const { trigger, preview, action } = mountImage({ preview: true });
        trigger()!.click();
        await nextTick();
        await nextTick();
        const at = (x: number, y: number, type: string) => preview().dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, button: 0, bubbles: true }));
        // Not zoomed: nothing to pan.
        at(0, 0, 'pointerdown');
        at(30, 20, 'pointermove');
        expect(preview().style.transform).toContain('translate(0px, 0px)');
        at(30, 20, 'pointerup');
        action('Zoom in').click();
        await nextTick();
        at(0, 0, 'pointerdown');
        at(30, 20, 'pointermove');
        await nextTick();
        expect(preview().style.transform).toContain('translate(30px, 20px)');
        at(30, 20, 'pointerup');
        await press(preview(), 'ArrowLeft');
        await nextTick();
        expect(preview().style.transform).toContain('translate(70px, 20px)');
        action('Zoom out').click();
        await nextTick();
        expect(preview().style.transform).toContain('translate(0px, 0px)');
    });

    it('has no accessibility violations, closed or open', async () => {
        const { trigger } = mountImage({ preview: true });
        await expectNoA11yViolations();
        trigger()!.click();
        await nextTick();
        await expectNoA11yViolations();
    });
});

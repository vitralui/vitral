import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Cropper from './Cropper.vue';
import type { CropValue } from './types';

/**
 * jsdom has no layout, so the stage and the image are given their sizes by
 * hand, the way the browser would have. Everything after that — the crop
 * settling itself, the keyboard, the turns — is the component's own work.
 */
const STAGE = { width: 400, height: 300 };
const IMAGE = { width: 1000, height: 500 };

function sizeStage() {
    const stage = document.querySelector<HTMLElement>('.vt-cropper-stage')!;
    // The ResizeObserver jsdom does not run: report the box directly.
    Object.defineProperty(stage, 'getBoundingClientRect', { value: () => ({ ...STAGE, top: 0, left: 0, right: STAGE.width, bottom: STAGE.height, x: 0, y: 0 }) });
    return stage;
}

function mountCropper(props: Record<string, unknown> = {}) {
    const value = ref<CropValue>({ x: 0, y: 0, width: 0, height: 0, rotate: 0, flipX: false, flipY: false });
    const changes: CropValue[] = [];
    const cropper = ref<InstanceType<typeof Cropper> | null>(null);
    const wrapper = mountVt(
        defineComponent(() => () =>
            h(Cropper, {
                ref: cropper,
                src: 'photo.jpg',
                alt: 'A photograph',
                height: STAGE.height,
                ...props,
                modelValue: value.value,
                'onUpdate:modelValue': (v: CropValue) => (value.value = v),
                onChange: (v: CropValue) => changes.push(v)
            })
        )
    );
    const image = document.querySelector<HTMLImageElement>('img.vt-cropper-image')!;
    Object.defineProperty(image, 'naturalWidth', { value: IMAGE.width });
    Object.defineProperty(image, 'naturalHeight', { value: IMAGE.height });
    return { value, changes, wrapper, image, cropper };
}

/** The image has arrived and the stage has been measured. */
async function ready(image: HTMLImageElement, component: { value: { width: number } }) {
    sizeStage();
    image.dispatchEvent(new Event('load'));
    await nextTick();
    return component;
}

const area = () => document.querySelector<HTMLElement>('.vt-cropper-area')!;

describe('Cropper', () => {
    it('gives itself a centred crop once it knows the image, and names it', async () => {
        const { value, image } = mountCropper();
        expect(value.value.width).toBe(0);
        await ready(image, value);

        expect(value.value.width).toBeGreaterThan(0);
        // Centred in the image's own pixels.
        expect(value.value.x + value.value.width / 2).toBeCloseTo(IMAGE.width / 2);
        expect(value.value.y + value.value.height / 2).toBeCloseTo(IMAGE.height / 2);
        expect(area().getAttribute('aria-label')).toBe('Crop');
        expect(area().tabIndex).toBe(0);
    });

    it('is one tab stop, with the handles left to the pointer', async () => {
        const { image, value } = mountCropper();
        await ready(image, value);
        expect(document.querySelectorAll('.vt-cropper-handle')).toHaveLength(8);
        for (const handle of document.querySelectorAll('.vt-cropper-handle')) {
            expect(handle.getAttribute('aria-hidden')).toBe('true');
            expect((handle as HTMLElement).tabIndex).toBe(-1);
        }
    });

    it('moves with the arrows and resizes with Shift, announcing where it landed', async () => {
        const { image, value } = mountCropper();
        await ready(image, value);
        const before = { ...value.value };

        area().focus();
        await nextTick();
        const status = document.querySelector('[role="status"]')!;
        expect(status.textContent).toMatch(/at \d+, \d+/);

        await press(area(), 'ArrowRight');
        expect(value.value.x).toBeGreaterThan(before.x);
        expect(value.value.width).toBe(before.width);

        const moved = { ...value.value };
        await press(area(), 'ArrowRight', { shiftKey: true });
        expect(value.value.width).toBeGreaterThan(moved.width);
        expect(value.value.x).toBe(moved.x);

        await press(area(), 'Home');
        expect(value.value.x).toBe(0);
        expect(value.value.y).toBe(0);
    });

    it('holds a ratio, and a circle is a square', async () => {
        const { image, value } = mountCropper({ aspect: '16:9' });
        await ready(image, value);
        expect(value.value.width / value.value.height).toBeCloseTo(16 / 9);

        document.body.innerHTML = '';
        const round = mountCropper({ shape: 'circle' });
        await ready(round.image, round.value);
        expect(round.value.value.width).toBeCloseTo(round.value.value.height);
        expect(document.querySelector('.vt-cropper')!.classList.contains('vt-cropper-circle')).toBe(true);
        // A circle needs no handles: it is dragged and zoomed.
        expect(document.querySelectorAll('.vt-cropper-handle')).toHaveLength(0);
    });

    it('turns the crop with the image, so it keeps pointing at the same part of it', async () => {
        const { image, value, changes } = mountCropper({ rotatable: true });
        await ready(image, value);
        value.value = { ...value.value, x: 100, y: 50, width: 200, height: 100 };
        await nextTick();

        document.querySelector<HTMLButtonElement>('button[aria-label="Rotate right"]')!.click();
        await nextTick();

        expect(value.value.rotate).toBe(90);
        // The image is 1000x500, so turned it is 500x1000 and the crop's sides swap.
        expect(value.value.width).toBe(100);
        expect(value.value.height).toBe(200);
        expect(value.value.x + value.value.width).toBeLessThanOrEqual(500);
        expect(value.value.y + value.value.height).toBeLessThanOrEqual(1000);
        expect(changes.at(-1)!.rotate).toBe(90);
    });

    it('flips without moving the crop off the picture', async () => {
        const { image, value } = mountCropper({ rotatable: true });
        await ready(image, value);
        value.value = { ...value.value, x: 0, y: 0, width: 200, height: 100 };
        await nextTick();

        document.querySelector<HTMLButtonElement>('button[aria-label="Flip horizontally"]')!.click();
        await nextTick();
        expect(value.value.flipX).toBe(true);
        expect(value.value.x).toBe(IMAGE.width - 200);
    });

    it('hands back a canvas the size of the crop, and nothing before the image has loaded', async () => {
        const { image, value, cropper } = mountCropper();
        expect(cropper.value!.crop()).toBeNull();
        await ready(image, value);

        // jsdom has no 2d context to draw with, but the canvas is still sized,
        // which is the part this component decides.
        const canvas = cropper.value!.crop()!;
        expect(canvas.width).toBe(Math.round(value.value.width));
        expect(canvas.height).toBe(Math.round(value.value.height));
        expect(cropper.value!.crop({ width: 120 })!.width).toBe(120);
    });

    it('has no axe violations, at rest and while a ratio is being chosen', async () => {
        const { wrapper, image, value } = mountCropper({
            rotatable: true,
            aspects: [
                { label: 'Free', value: 'free' },
                { label: 'Square', value: 1 }
            ]
        });
        await ready(image, value);
        await expectNoA11yViolations();
    });
});

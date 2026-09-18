import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Carousel from './Carousel.vue';

const items = ['One', 'Two', 'Three', 'Four', 'Five'];

function mountCarousel(props: Record<string, unknown> = {}) {
    const page = ref(0);
    mountVt(
        defineComponent(() => () =>
            h(
                Carousel,
                { value: items, ariaLabel: 'Highlights', ...props, page: page.value, 'onUpdate:page': (v: number) => (page.value = v) },
                { item: ({ data }: { data: string }) => h('p', data) }
            )
        )
    );
    const region = () => document.querySelector<HTMLElement>('section')!;
    const slides = () => Array.from(document.querySelectorAll<HTMLElement>('[aria-roledescription="slide"]'));
    const shown = () => slides().filter((s) => !s.hasAttribute('aria-hidden')).map((s) => s.textContent);
    const button = (label: string) => document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
    return { page, region, slides, shown, button };
}

describe('Carousel', () => {
    it('is a named carousel region of slides named by position, hiding the ones out of view', () => {
        const { region, slides, shown } = mountCarousel({ numVisible: 2 });
        expect(region().getAttribute('aria-roledescription')).toBe('carousel');
        expect(region().getAttribute('aria-label')).toBe('Highlights');
        expect(slides()[0]!.getAttribute('role')).toBe('group');
        expect(slides()[1]!.getAttribute('aria-label')).toBe('2 of 5');
        expect(shown()).toEqual(['One', 'Two']);
        expect(slides()[2]!.hasAttribute('inert')).toBe(true);
    });

    it('pages with the navigators and the slide pickers, and stops at the ends when told not to wrap', async () => {
        const { page, shown, button } = mountCarousel({ numVisible: 2, numScroll: 2, circular: false });
        expect(button('Previous').disabled).toBe(true);
        button('Next').click();
        await nextTick();
        expect(page.value).toBe(1);
        expect(shown()).toEqual(['Three', 'Four']);
        expect(button('Go to slide 2').getAttribute('aria-current')).toBe('true');
        button('Go to slide 3').click();
        await nextTick();
        expect(shown()).toEqual(['Four', 'Five']);
        expect(button('Next').disabled).toBe(true);
        expect(document.getElementById(button('Next').getAttribute('aria-controls')!)?.getAttribute('aria-live')).toBe('polite');
    });

    it('pages on a swipe, with the track following the pointer, and ignores a short drag', async () => {
        const { page, button } = mountCarousel({ circular: false });
        const viewport = document.querySelector<HTMLElement>('.vt-carousel-viewport')!;
        const track = document.querySelector<HTMLElement>('.vt-carousel-track')!;
        const pointer = (type: string, x: number) => viewport.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: 10, pointerId: 1, bubbles: true }));
        pointer('pointerdown', 200);
        pointer('pointermove', 150);
        await nextTick();
        expect(track.style.transform).toContain('-50px');
        expect(track.classList.contains('vt-carousel-track-dragging')).toBe(true);
        pointer('pointerup', 120);
        await nextTick();
        expect(page.value).toBe(1);
        expect(track.classList.contains('vt-carousel-track-dragging')).toBe(false);
        // The click that ends a drag does not reach the slide.
        const onClick = vi.fn();
        viewport.addEventListener('click', onClick);
        viewport.querySelector('p')!.click();
        expect(onClick).not.toHaveBeenCalled();
        pointer('pointerdown', 200);
        pointer('pointerup', 190);
        await nextTick();
        expect(page.value).toBe(1);
        pointer('pointerdown', 100);
        pointer('pointermove', 180);
        pointer('pointerup', 180);
        await nextTick();
        expect(page.value).toBe(0);
        expect(button('Previous').disabled).toBe(true);
    });

    it('wraps when circular', async () => {
        // Wrapping is the default; this is the same behaviour asked for by name.
        const { page, button } = mountCarousel({ circular: true });
        button('Previous').click();
        await nextTick();
        expect(page.value).toBe(4);
    });

    describe('rotation', () => {
        beforeEach(() => vi.useFakeTimers());
        afterEach(() => vi.useRealTimers());

        it('rotates with a pause button first, silently, and holds while focus is inside', async () => {
            const { page, region, button } = mountCarousel({ autoplayInterval: 1000 });
            const pauseButton = button('Pause slideshow');
            expect(document.getElementById(pauseButton.getAttribute('aria-controls')!)?.getAttribute('aria-live')).toBe('off');
            vi.advanceTimersByTime(1000);
            await nextTick();
            expect(page.value).toBe(1);
            region().dispatchEvent(new FocusEvent('focusin'));
            await nextTick();
            vi.advanceTimersByTime(3000);
            expect(page.value).toBe(1);
            region().dispatchEvent(new FocusEvent('focusout'));
            await nextTick();
            pauseButton.click();
            await nextTick();
            expect(button('Play slideshow')).not.toBeNull();
            vi.advanceTimersByTime(3000);
            expect(page.value).toBe(1);
        });
    });

    it('has no accessibility violations', async () => {
        mountCarousel({ numVisible: 2, autoplayInterval: 5000 });
        await expectNoA11yViolations();
    });
});

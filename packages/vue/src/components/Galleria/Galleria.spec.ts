import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Galleria from './Galleria.vue';

const photos = ['a', 'b', 'c', 'd', 'e'].map((k) => ({ src: `${k}.jpg`, alt: `Photo ${k.toUpperCase()}` }));

function mountGalleria(props: Record<string, unknown> = {}) {
    const index = ref(0);
    const visible = ref(false);
    mountVt(
        defineComponent(() => () => [
            h('button', { id: 'open' }, 'Open'),
            h(
                Galleria,
                {
                    value: photos,
                    ariaLabel: 'Trip photos',
                    ...props,
                    activeIndex: index.value,
                    'onUpdate:activeIndex': (v: number) => (index.value = v),
                    visible: visible.value,
                    'onUpdate:visible': (v: boolean) => (visible.value = v)
                },
                {
                    item: ({ item }: { item: (typeof photos)[0] }) => h('img', { src: item.src, alt: item.alt }),
                    thumbnail: ({ item }: { item: (typeof photos)[0] }) => h('img', { src: item.src, alt: '' })
                }
            )
        ])
    );
    const slide = () => document.querySelector<HTMLElement>('[aria-roledescription="slide"]');
    const thumbs = () => Array.from(document.querySelectorAll<HTMLButtonElement>('ul[aria-label="Thumbnails"] button'));
    const button = (label: string) => document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
    return { index, visible, slide, thumbs, button };
}

describe('Galleria', () => {
    it('shows one item as a named slide, with a window of thumbnails as one tab stop', () => {
        const { slide, thumbs } = mountGalleria();
        expect(document.querySelector('section')!.getAttribute('aria-label')).toBe('Trip photos');
        expect(slide()!.getAttribute('aria-label')).toBe('1 of 5');
        expect(slide()!.querySelector('img')!.getAttribute('alt')).toBe('Photo A');
        expect(thumbs()).toHaveLength(3);
        expect(thumbs().map((t) => t.tabIndex)).toEqual([0, -1, -1]);
        expect(thumbs()[0]!.getAttribute('aria-current')).toBe('true');
        expect(document.getElementById(thumbs()[0]!.getAttribute('aria-controls')!)!.getAttribute('aria-live')).toBe('polite');
    });

    it('keeps the one image element across a move, and says where it landed', async () => {
        const { index, slide } = mountGalleria();
        const status = document.querySelector('.vt-galleria-stage .vt-sr-only')!;
        const first = slide()!.querySelector('img')!;
        expect(status.textContent).toBe('1 of 5');

        index.value = 2;
        await nextTick();

        // The same <img>, with a new source: it goes on showing the picture it
        // has until the next one has loaded, so the stage never empties and
        // nothing below it moves. A rebuilt element would be a different one.
        expect(slide()!.querySelector('img')).toBe(first);
        expect(first.getAttribute('src')).toBe('c.jpg');
        expect(status.textContent).toBe('3 of 5');
    });

    it('moves with the arrows on the thumbnails and follows with the window', async () => {
        const { index, thumbs, slide } = mountGalleria();
        thumbs()[0]!.focus();
        await press(thumbs()[0]!, 'ArrowRight');
        await press(document.activeElement!, 'ArrowRight');
        await nextTick();
        expect(index.value).toBe(2);
        expect(slide()!.getAttribute('aria-label')).toBe('3 of 5');
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Go to slide 3');
        await press(document.activeElement!, 'End');
        await nextTick();
        expect(index.value).toBe(4);
        expect(thumbs().map((t) => t.getAttribute('aria-label'))).toEqual(['Go to slide 3', 'Go to slide 4', 'Go to slide 5']);
    });

    it('steps with the item navigators and indicators, wrapping when circular', async () => {
        const { index, button } = mountGalleria({ showItemNavigators: true, showIndicators: true, circular: true, showThumbnails: false });
        button('Previous').click();
        await nextTick();
        expect(index.value).toBe(4);
        button('Go to slide 2').click();
        await nextTick();
        expect(index.value).toBe(1);
        expect(button('Go to slide 2').getAttribute('aria-current')).toBe('true');
    });

    it('moves to the neighbouring item on a swipe', async () => {
        // Not circular here, so the ends are ends: the wrap is tested by itself.
        const { index, slide } = mountGalleria({ circular: false });
        const swipe = async (from: number, to: number) => {
            const el = slide()!;
            el.dispatchEvent(new PointerEvent('pointerdown', { clientX: from, clientY: 0, pointerId: 1, bubbles: true }));
            el.dispatchEvent(new PointerEvent('pointermove', { clientX: to, clientY: 0, pointerId: 1, bubbles: true }));
            await nextTick();
            expect(el.style.transform).toBe(`translateX(${to - from}px)`);
            el.dispatchEvent(new PointerEvent('pointerup', { clientX: to, clientY: 0, pointerId: 1, bubbles: true }));
            await nextTick();
        };
        await swipe(300, 200);
        expect(index.value).toBe(1);
        expect(slide()!.getAttribute('aria-label')).toBe('2 of 5');
        await swipe(100, 250);
        expect(index.value).toBe(0);
        // Told not to wrap: nothing before the first.
        await swipe(100, 250);
        expect(index.value).toBe(0);
    });

    it('opens full screen as a modal dialog and closes with its button', async () => {
        const { visible, button } = mountGalleria({ fullScreen: true });
        expect(document.querySelector('section')).toBeNull();
        document.getElementById('open')!.focus();
        visible.value = true;
        await nextTick();
        await nextTick();
        const dialog = document.querySelector('[role="dialog"]')!;
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(dialog.contains(document.activeElement)).toBe(true);
        button('Close').click();
        await nextTick();
        expect(visible.value).toBe(false);
    });

    describe('rotation', () => {
        beforeEach(() => vi.useFakeTimers());
        afterEach(() => vi.useRealTimers());

        it('plays with a pause button and holds while pointed at', async () => {
            const { index, button } = mountGalleria({ autoPlay: true, transitionInterval: 1000 });
            vi.advanceTimersByTime(1000);
            expect(index.value).toBe(1);
            document.querySelector('section')!.dispatchEvent(new Event('pointerenter'));
            await nextTick();
            vi.advanceTimersByTime(3000);
            expect(index.value).toBe(1);
            button('Pause slideshow').click();
            await nextTick();
            expect(button('Play slideshow')).not.toBeNull();
        });
    });

    it('has no accessibility violations', async () => {
        mountGalleria({ showItemNavigators: true, autoPlay: true });
        await expectNoA11yViolations();
    });
});

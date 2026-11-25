import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrollbars } from './scrollbars';

// A box of 100 pixels holding 1000: the bars on their own, with the sizes jsdom does not lay out given by hand.
function mountBox(options: Parameters<typeof scrollbars>[1] = {}) {
    const box = document.createElement('div');
    document.body.appendChild(box);
    Object.defineProperties(box, { clientHeight: { configurable: true, get: () => 100 }, scrollHeight: { configurable: true, get: () => 1000 } });
    const bars = scrollbars(box, { visibility: 'always', part: (name, state) => ({ class: `${name}${state.axis ? `-${state.axis}` : ''}` }), ...options });
    const track = box.nextElementSibling!.querySelector<HTMLElement>('.track-y')!;
    return { box, bars, track };
}

afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
});

describe('drawn scrollbars', () => {
    it('page towards a press on the track, and held keep paging until the thumb is under the pointer', () => {
        vi.useFakeTimers();
        const { box, track } = mountBox();
        expect(track.style.pointerEvents).toBe('auto');
        track.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientY: 80 }));
        expect(box.scrollTop).toBe(90);
        vi.advanceTimersByTime(2000);
        // The thumb, 20 of the 100, now covers the 80th pixel: no further.
        expect(box.scrollTop).toBe(720);
        document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        track.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientY: 0 }));
        document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        expect(box.scrollTop).toBe(630);
    });

    it('let a press through to what is under the track while they are hidden', () => {
        const { track } = mountBox({ visibility: 'hover' });
        expect(track.style.pointerEvents).toBe('');
    });

    it('keep clear of what stays put while the box scrolls, and page by what is left', () => {
        const { box, bars, track } = mountBox({ inset: () => ({ top: 30, bottom: 10, start: 50 }) });
        const bar = track.parentElement!;
        expect([bar.style.marginTop, bar.style.marginBottom]).toEqual(['30px', '10px']);
        expect(box.nextElementSibling!.querySelector<HTMLElement>('.bar-x')!.style.marginLeft).toBe('50px');
        track.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientY: 80 }));
        document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        expect(box.scrollTop).toBe(54);
        bars.destroy();
    });

    it('write the room a shown bar takes on the box when asked to keep off the content, and take it back', () => {
        const { box, bars, track } = mountBox({ gutter: true });
        const bar = track.parentElement!;
        Object.defineProperty(bar, 'offsetWidth', { configurable: true, get: () => 8 });
        bar.style.top = '2px';
        bars.refresh();
        // The bar and a gap on each side; no horizontal bar, so nothing at the bottom.
        expect(box.style.getPropertyValue('--vt-scrollbar-gutter-y')).toBe('12px');
        expect(box.style.getPropertyValue('--vt-scrollbar-gutter-x')).toBe('');
        bars.update({ gutter: false });
        expect(box.style.getPropertyValue('--vt-scrollbar-gutter-y')).toBe('');
        bars.update({ gutter: true });
        bars.destroy();
        expect(box.style.getPropertyValue('--vt-scrollbar-gutter-y')).toBe('');
    });
});

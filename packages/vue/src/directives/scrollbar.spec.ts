import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, resolveDirective, withDirectives } from 'vue';
import { mountVt } from '../../test/utils';
import { Scrollbar, type ScrollbarDirectiveValue } from './scrollbar';

function mountBox(value: ScrollbarDirectiveValue, modifiers: Record<string, boolean> = {}, vitral?: Parameters<typeof mountVt>[2], boxAttrs: Record<string, unknown> = {}) {
    const bound = ref<ScrollbarDirectiveValue>(value);
    const wrapper = mountVt(
        defineComponent({
            directives: { scrollbar: Scrollbar },
            setup() {
                return () =>
                    h('div', { id: 'holder', style: 'position: relative' }, [
                        withDirectives(h('div', { id: 'box', style: 'overflow: auto; height: 100px', ...boxAttrs }, h('p', 'Long')), [[resolveDirective('scrollbar')!, bound.value, undefined, modifiers]])
                    ]);
            }
        }),
        {},
        vitral
    );
    const box = () => document.getElementById('box')!;
    const layer = () => document.querySelector<HTMLElement>('#holder > .vt-scrollpanel-bars');
    return { wrapper, bound, box, layer };
}

describe('v-scrollbar', () => {
    it('draws the bars after the box, hides the native ones, and takes them away on unmount', async () => {
        const { wrapper, box, layer } = mountBox(undefined);
        await nextTick();
        expect(box().hasAttribute('data-vt-scrollbars')).toBe(true);
        expect(layer()?.getAttribute('aria-hidden')).toBe('true');
        expect(layer()?.previousElementSibling).toBe(box());
        expect(layer()!.classList.contains('vt-scrollpanel-bars-shown')).toBe(false);
        wrapper.unmount();
        expect(document.querySelector('.vt-scrollpanel-bars')).toBeNull();
    });

    it('shows them always with the modifier, and follows a value that changes', async () => {
        const { bound, box, layer } = mountBox(undefined, { always: true });
        await nextTick();
        expect(layer()!.classList.contains('vt-scrollpanel-bars-shown')).toBe(true);
        bound.value = 'native';
        await nextTick();
        expect(layer()).toBeNull();
        expect(box().hasAttribute('data-vt-scrollbars')).toBe(false);
        bound.value = 'hover';
        await nextTick();
        expect(layer()!.classList.contains('vt-scrollpanel-bars-shown')).toBe(false);
    });

    it("follows the application's scrollbar option when told nothing", async () => {
        const { layer } = mountBox(undefined, {}, { scrollbar: 'native' });
        await nextTick();
        expect(layer()).toBeNull();
    });

    it('keeps the bars inside a positioned box, so a press on them is not outside it, but never inside an editable one', async () => {
        const popup = mountBox(undefined, {}, undefined, { style: 'overflow: auto; height: 100px; position: absolute' });
        await nextTick();
        expect(popup.box().lastElementChild?.classList.contains('vt-scrollpanel-bars')).toBe(true);
        popup.wrapper.unmount();

        const editable = mountBox(undefined, {}, undefined, { style: 'overflow: auto; height: 100px; position: relative', contenteditable: 'true' });
        await nextTick();
        expect(editable.box().querySelector('.vt-scrollpanel-bars')).toBeNull();
        expect(editable.layer()?.previousElementSibling).toBe(editable.box());
        editable.wrapper.unmount();
    });

    it("reads the application's option from a <script setup> component too, whose instance is closed", async () => {
        const Box = defineComponent({
            directives: { scrollbar: Scrollbar },
            setup(_, { expose }) {
                expose({});
                return () => withDirectives(h('div', { id: 'closed', style: 'overflow: auto; height: 50px' }, h('p', 'Long')), [[resolveDirective('scrollbar')!]]);
            }
        });
        const wrapper = mountVt(Box, {}, { theme: 'none', scrollbar: 'always' });
        await nextTick();
        expect(document.querySelector('#closed + .vt-scrollpanel-bars')?.classList.contains('vt-scrollpanel-bars-shown')).toBe(true);
        wrapper.unmount();
    });

    it('puts arrows at the ends with .arrows: a press scrolls a step, and holding it keeps scrolling', async () => {
        vi.useFakeTimers();
        const { wrapper, box } = mountBox(undefined, { arrows: true });
        await nextTick();
        Object.defineProperties(box(), { clientHeight: { configurable: true, get: () => 100 }, scrollHeight: { configurable: true, get: () => 1000 } });
        const down = document.querySelector<HTMLElement>('.vt-scrollpanel-arrow-down')!;
        expect(document.querySelector('.vt-scrollpanel-bar-arrows')).not.toBeNull();
        expect(down.querySelector('svg')).not.toBeNull();
        down.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        expect(box().scrollTop).toBe(40);
        vi.advanceTimersByTime(350 + 50 * 3);
        expect(box().scrollTop).toBe(160);
        document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        vi.advanceTimersByTime(500);
        expect(box().scrollTop).toBe(160);
        document.querySelector<HTMLElement>('.vt-scrollpanel-arrow-up')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        expect(box().scrollTop).toBe(120);
        vi.useRealTimers();
        wrapper.unmount();
    });

    it("has no arrows unless asked, and follows the application's scrollbarArrows", async () => {
        const plain = mountBox(undefined);
        await nextTick();
        expect(getComputedStyle(document.querySelector<HTMLElement>('.vt-scrollpanel-arrow')!).display).toBe('none');
        plain.wrapper.unmount();
        const asked = mountBox(undefined, {}, { theme: 'none', scrollbarArrows: true });
        await nextTick();
        expect(document.querySelector<HTMLElement>('.vt-scrollpanel-arrow')!.style.display).toBe('');
        asked.wrapper.unmount();
    });
});

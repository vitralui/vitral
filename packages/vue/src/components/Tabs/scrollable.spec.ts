import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import { Tab, TabList, TabPanel, TabPanels, Tabs, type TabValue } from './index';

const labels = Array.from({ length: 12 }, (_, i) => `Section ${i + 1}`);

function mountStrip(props: Record<string, unknown> = { scrollable: true }) {
    const value = ref<TabValue | undefined>('s0');
    const wrapper = mountVt(
        defineComponent(
            () => () =>
                h(Tabs, { ...props, value: value.value, 'onUpdate:value': (v: TabValue | undefined) => (value.value = v) }, () => [
                    h(TabList, { 'aria-label': 'Sections' }, () => labels.map((label, i) => h(Tab, { key: i, value: `s${i}` }, () => label))),
                    h(TabPanels, null, () => labels.map((label, i) => h(TabPanel, { key: i, value: `s${i}` }, () => label)))
                ])
        )
    );
    const strip = () => document.querySelector<HTMLElement>('.vt-tabs-content')!;
    const back = () => document.querySelector<HTMLButtonElement>('.vt-tabs-nav-button-start')!;
    const forward = () => document.querySelector<HTMLButtonElement>('.vt-tabs-nav-button-end')!;
    return { wrapper, value, strip, back, forward };
}

/** Tabs `length` long in a strip `room` long, along `axis`: the layout jsdom does not do. */
function fit(strip: HTMLElement, length: number, room: number, axis: 'x' | 'y' = 'x') {
    const [size, client] = axis === 'x' ? ['scrollWidth', 'clientWidth'] : ['scrollHeight', 'clientHeight'];
    Object.defineProperty(strip.querySelector('[role="tablist"]')!, size, { value: length, configurable: true });
    Object.defineProperty(strip.parentElement!, client, { value: room, configurable: true });
}

/** A strip 300px wide holding 900px of tabs, scrolled to `left`. */
function lay(strip: HTMLElement, left: number) {
    fit(strip, 900, 300);
    Object.defineProperties(strip, {
        clientWidth: { value: 300, configurable: true },
        scrollWidth: { value: 900, configurable: true },
        scrollLeft: { value: left, configurable: true, writable: true }
    });
    strip.dispatchEvent(new Event('scroll'));
}

afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});

describe('scrollable Tabs', () => {
    it('shows a button only at an end that has tabs out of sight', async () => {
        const { strip, back, forward } = mountStrip();
        expect(strip().classList).toContain('vt-tabs-content-scrollable');
        lay(strip(), 0);
        await nextTick();
        expect(back().hidden).toBe(true);
        expect(forward().hidden).toBe(false);
        lay(strip(), 300);
        await nextTick();
        expect(back().hidden).toBe(false);
        expect(forward().hidden).toBe(false);
        lay(strip(), 600);
        await nextTick();
        expect(forward().hidden).toBe(true);
    });

    it('moves nearly a page at a time, the right way round in either direction', async () => {
        const { strip, back, forward } = mountStrip();
        lay(strip(), 300);
        await nextTick();
        const scrollBy = vi.fn();
        strip().scrollBy = scrollBy as never;
        forward().click();
        back().click();
        expect(scrollBy).toHaveBeenNthCalledWith(1, { left: 240, behavior: 'smooth' });
        expect(scrollBy).toHaveBeenNthCalledWith(2, { left: -240, behavior: 'smooth' });
    });

    it('keeps its buttons out of the tab order, named for where they go', async () => {
        const { strip, back, forward } = mountStrip();
        lay(strip(), 0);
        await nextTick();
        expect(back().getAttribute('tabindex')).toBe('-1');
        expect(back().getAttribute('aria-label')).toBe('Previous');
        expect(forward().getAttribute('aria-label')).toBe('Next');
    });

    it('brings the selected tab into view', async () => {
        const reveal = vi.fn();
        HTMLElement.prototype.scrollIntoView = reveal;
        const { value } = mountStrip();
        value.value = 's10';
        await nextTick();
        await nextTick();
        expect(reveal).toHaveBeenLastCalledWith(expect.objectContaining({ block: 'nearest', inline: 'nearest' }));
    });

    it('draws no buttons, and keeps no room for them, while every tab fits', async () => {
        const { strip } = mountStrip();
        fit(strip(), 280, 300);
        strip().dispatchEvent(new Event('scroll'));
        await nextTick();
        expect(document.querySelector('.vt-tabs-nav-button')).toBeNull();
        expect(document.querySelector('.vt-tabs-tablist-overflowing')).toBeNull();
        lay(strip(), 0);
        await nextTick();
        expect(document.querySelectorAll('.vt-tabs-nav-button')).toHaveLength(2);
        expect(document.querySelector('.vt-tabs-tablist-overflowing')).not.toBeNull();
    });

    it('draws no buttons when it is not scrollable', () => {
        mountStrip({});
        expect(document.querySelector('.vt-tabs-nav-button')).toBeNull();
        expect(document.querySelector('.vt-tabs-content-scrollable')).toBeNull();
    });

    it('has no accessibility violations', async () => {
        mountStrip();
        await expectNoA11yViolations();
    });
});

describe('scroll buttons', () => {
    it('go together at one end, disabled rather than hidden where there is nothing more', async () => {
        const { strip } = mountStrip({ scrollable: true, scrollButtons: 'end' });
        lay(strip(), 0);
        await nextTick();
        const group = document.querySelector('.vt-tabs-nav-group-end')!;
        const [back, forward] = group.querySelectorAll<HTMLButtonElement>('button');
        expect(strip().nextElementSibling).toBe(group);
        expect(back!.disabled).toBe(true);
        expect(back!.hidden).toBe(false);
        expect(forward!.disabled).toBe(false);
        expect(document.querySelectorAll('.vt-tabs-nav-button')).toHaveLength(2);
    });

    it('can go at the start, or not at all', async () => {
        mountStrip({ scrollable: true, scrollButtons: 'start' });
        const strip = document.querySelector<HTMLElement>('.vt-tabs-content')!;
        lay(strip, 0);
        await nextTick();
        expect(strip.previousElementSibling!.classList).toContain('vt-tabs-nav-group-start');
        document.body.innerHTML = '';
        mountStrip({ scrollable: true, scrollButtons: 'none' });
        expect(document.querySelector('.vt-tabs-nav-button')).toBeNull();
        expect(document.querySelector('.vt-tabs-content-scrollable')).not.toBeNull();
    });

    it('scroll an upright strip up and down', async () => {
        mountStrip({ scrollable: true, orientation: 'vertical' });
        const strip = document.querySelector<HTMLElement>('.vt-tabs-content')!;
        fit(strip, 600, 200, 'y');
        Object.defineProperties(strip, {
            clientHeight: { value: 200, configurable: true },
            scrollHeight: { value: 600, configurable: true },
            scrollTop: { value: 100, configurable: true, writable: true }
        });
        strip.dispatchEvent(new Event('scroll'));
        await nextTick();
        const scrollBy = vi.fn();
        strip.scrollBy = scrollBy as never;
        document.querySelector<HTMLButtonElement>('.vt-tabs-nav-button-end')!.click();
        expect(scrollBy).toHaveBeenCalledWith({ top: 160, behavior: 'smooth' });
        expect(document.querySelector('.vt-tabs-nav-button-start svg')).not.toBeNull();
    });
});

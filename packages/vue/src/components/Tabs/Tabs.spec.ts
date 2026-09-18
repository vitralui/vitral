import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import { Tab, TabList, TabPanel, TabPanels, Tabs, type TabValue } from './index';

const items = [
    { value: 'mail', label: 'Mail' },
    { value: 'calendar', label: 'Calendar' },
    { value: 'files', label: 'Files', disabled: true },
    { value: 'people', label: 'People' }
];

function mountTabs(props: Record<string, unknown> = {}) {
    const value = ref<TabValue | undefined>('value' in props ? (props.value as TabValue | undefined) : 'mail');
    const wrapper = mountVt(
        defineComponent(
            () => () =>
                h(Tabs, { ...props, value: value.value, 'onUpdate:value': (v: TabValue | undefined) => (value.value = v) }, () => [
                    h(TabList, { 'aria-label': 'Sections' }, () => items.map((t) => h(Tab, { key: t.value, value: t.value, disabled: t.disabled }, () => t.label))),
                    h(TabPanels, null, () => items.map((t) => h(TabPanel, { key: t.value, value: t.value }, () => h('p', `${t.label} panel`))))
                ])
        )
    );
    const tabs = () => Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const panels = () => Array.from(document.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
    const tablist = () => document.querySelector<HTMLElement>('[role="tablist"]')!;
    return { wrapper, value, tabs, panels, tablist };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Tabs', () => {
    it('is a named tablist of tabs, each controlling a panel labelled by it', () => {
        const { tabs, panels, tablist } = mountTabs();
        expect(tablist().getAttribute('aria-label')).toBe('Sections');
        expect(tablist().getAttribute('aria-orientation')).toBe('horizontal');
        const [mail] = tabs();
        expect(mail!.getAttribute('aria-selected')).toBe('true');
        expect(mail!.getAttribute('aria-controls')).toBe(panels()[0]!.id);
        expect(panels()[0]!.getAttribute('aria-labelledby')).toBe(mail!.id);
        expect(panels()[0]!.getAttribute('tabindex')).toBe('0');
        expect(tabs()[1]!.getAttribute('aria-selected')).toBe('false');
        expect(panels()[1]!.style.display).toBe('none');
    });

    it('keeps only the selected tab in the tab order', async () => {
        const { tabs } = mountTabs({ value: 'calendar' });
        // Tabs register as they are set up, so the first tab settles once the later ones exist.
        await nextTick();
        expect(tabs().map((t) => t.tabIndex)).toEqual([-1, 0, -1, -1]);
    });

    it('selects as the arrows move (automatic activation), skipping disabled tabs and wrapping', async () => {
        const { tabs, value, panels } = mountTabs();
        const [mail, calendar, , people] = tabs();
        mail!.focus();
        await press(mail!, 'ArrowRight');
        expect(document.activeElement).toBe(calendar);
        expect(value.value).toBe('calendar');
        expect(calendar!.tabIndex).toBe(0);
        expect(mail!.tabIndex).toBe(-1);
        expect(panels()[1]!.style.display).toBe('');

        await press(calendar!, 'ArrowRight');
        expect(document.activeElement).toBe(people);
        await press(people!, 'ArrowRight');
        expect(document.activeElement).toBe(mail);
        await press(mail!, 'ArrowLeft');
        expect(value.value).toBe('people');
        await press(people!, 'Home');
        expect(value.value).toBe('mail');
        await press(mail!, 'End');
        expect(value.value).toBe('people');
    });

    it('ignores Up/Down when horizontal, and uses them when vertical', async () => {
        const horizontal = mountTabs();
        await press(horizontal.tabs()[0]!, 'ArrowDown');
        expect(horizontal.value.value).toBe('mail');
        horizontal.wrapper.unmount();

        const { tabs, value, tablist, wrapper } = mountTabs({ orientation: 'vertical' });
        expect(tablist().getAttribute('aria-orientation')).toBe('vertical');
        expect(wrapper.find('.vt-tabs-vertical').exists()).toBe(true);
        tabs()[0]!.focus();
        await press(tabs()[0]!, 'ArrowDown');
        expect(value.value).toBe('calendar');
        await press(tabs()[1]!, 'ArrowRight');
        expect(value.value).toBe('calendar');
    });

    it('with selectOnFocus off, the arrows move focus and Enter or a click selects', async () => {
        const { tabs, value } = mountTabs({ selectOnFocus: false });
        tabs()[0]!.focus();
        await press(tabs()[0]!, 'ArrowRight');
        expect(document.activeElement).toBe(tabs()[1]);
        expect(value.value).toBe('mail');
        tabs()[1]!.click();
        await nextTick();
        expect(value.value).toBe('calendar');
    });

    it('selects the first enabled tab while no value is given', () => {
        const { tabs, panels } = mountTabs({ value: undefined });
        expect(tabs()[0]!.getAttribute('aria-selected')).toBe('true');
        expect(tabs()[0]!.tabIndex).toBe(0);
        expect(panels()[0]!.style.display).toBe('');
    });

    it('renders only the selected panel when lazy', () => {
        const { panels, tabs } = mountTabs({ lazy: true });
        expect(panels()).toHaveLength(1);
        expect(tabs()[1]!.hasAttribute('aria-controls')).toBe(false);
    });

    it('moves the indicator to the selected tab', async () => {
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            const index = Array.from(document.querySelectorAll('[role="tab"]')).indexOf(this);
            const left = index >= 0 ? 10 + index * 100 : 10;
            const width = index >= 0 ? 80 : 400;
            return { left, top: 0, width, height: 32, right: left + width, bottom: 32, x: left, y: 0, toJSON: () => ({}) } as DOMRect;
        });
        const { tabs } = mountTabs();
        await nextTick();
        const indicator = () => document.querySelector<HTMLElement>('.vt-tabs-indicator')!;
        expect(indicator().getAttribute('aria-hidden')).toBe('true');
        expect(indicator().style.transform).toBe('translateX(0px)');
        expect(indicator().style.width).toBe('80px');
        tabs()[3]!.click();
        await nextTick();
        await nextTick();
        expect(indicator().style.transform).toBe('translateX(300px)');
    });

    it('has no accessibility violations', async () => {
        const { tabs } = mountTabs();
        await expectNoA11yViolations();
        tabs()[3]!.click();
        await nextTick();
        await expectNoA11yViolations();
    });
});

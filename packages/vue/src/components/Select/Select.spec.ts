import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Select from './Select.vue';

const fruits = [
    { name: 'Apple', code: 'ap' },
    { name: 'Banana', code: 'ba' },
    { name: 'Blueberry', code: 'bl', off: true },
    { name: 'Cherry', code: 'ch' },
    { name: 'São Tomé fig', code: 'st' }
];

function mountSelect(props: Record<string, unknown> = {}) {
    const value = ref<unknown>(props.modelValue ?? null);
    const wrapper = mountVt(
        defineComponent(() => () => [
            h('label', { for: 'fruit' }, 'Fruit'),
            h(Select, {
                id: 'fruit',
                options: fruits,
                optionLabel: 'name',
                optionValue: 'code',
                optionDisabled: 'off',
                placeholder: 'Pick one',
                ...props,
                modelValue: value.value,
                'onUpdate:modelValue': (v: unknown) => (value.value = v)
            })
        ])
    );
    const combobox = () => document.querySelector<HTMLButtonElement>('[role="combobox"]')!;
    const listbox = () => document.querySelector<HTMLElement>('[role="listbox"]');
    const options = () => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
    const active = () => document.getElementById(combobox().getAttribute('aria-activedescendant') ?? '');
    return { wrapper, value, combobox, listbox, options, active };
}

describe('Select', () => {
    it('is a collapsed combobox named by its label, showing the placeholder', () => {
        const { combobox } = mountSelect();
        expect(combobox().getAttribute('aria-expanded')).toBe('false');
        expect(combobox().getAttribute('aria-haspopup')).toBe('listbox');
        expect(combobox().labels?.[0]?.textContent).toBe('Fruit');
        expect(combobox().textContent?.trim()).toBe('Pick one');
    });

    it('opens on click into a listbox it controls, labelled like the combobox', async () => {
        const { combobox, listbox, options } = mountSelect();
        combobox().click();
        await nextTick();
        expect(combobox().getAttribute('aria-expanded')).toBe('true');
        expect(combobox().getAttribute('aria-controls')).toBe(listbox()!.id);
        expect(listbox()!.getAttribute('aria-labelledby')).toBe(combobox().labels![0]!.id);
        expect(options().map((o) => o.textContent?.trim())).toEqual(fruits.map((f) => f.name));
    });

    it('moves with the arrows, skips disabled options and selects with Enter', async () => {
        const { combobox, value, active, listbox } = mountSelect();
        await press(combobox(), 'ArrowDown');
        expect(active()?.textContent?.trim()).toBe('Apple');
        await press(combobox(), 'ArrowDown');
        await press(combobox(), 'ArrowDown');
        expect(active()?.textContent?.trim()).toBe('Cherry');
        await press(combobox(), 'Enter');
        expect(value.value).toBe('ch');
        expect(listbox()).toBeNull();
        expect(combobox().textContent?.trim()).toBe('Cherry');
        expect(document.activeElement).toBe(combobox());
    });

    it('opens on the selected option and marks it selected', async () => {
        const { combobox, active, options } = mountSelect({ modelValue: 'ba' });
        await press(combobox(), 'ArrowDown');
        expect(active()?.textContent?.trim()).toBe('Banana');
        expect(options()[1]!.getAttribute('aria-selected')).toBe('true');
        expect(options()[0]!.getAttribute('aria-selected')).toBe('false');
    });

    it('jumps by typeahead, ignoring accents', async () => {
        const { combobox, active } = mountSelect();
        await press(combobox(), 's');
        expect(combobox().getAttribute('aria-expanded')).toBe('true');
        expect(active()?.textContent?.trim()).toBe('São Tomé fig');
    });

    it('closes on Escape and on a press outside, without choosing', async () => {
        const { combobox, value, listbox } = mountSelect();
        await press(combobox(), 'ArrowDown');
        await press(combobox(), 'Escape');
        expect(listbox()).toBeNull();
        combobox().click();
        await nextTick();
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        await nextTick();
        expect(listbox()).toBeNull();
        expect(value.value).toBeNull();
    });

    it('filters with a search box and reports when nothing matches', async () => {
        const { combobox, options, wrapper } = mountSelect({ filter: true });
        combobox().click();
        await nextTick();
        await nextTick();
        const search = document.querySelector<HTMLInputElement>('[role="searchbox"]')!;
        expect(document.activeElement).toBe(search);
        search.value = 'sao';
        search.dispatchEvent(new Event('input'));
        await nextTick();
        expect(options().map((o) => o.textContent?.trim())).toEqual(['São Tomé fig']);
        search.value = 'zzz';
        search.dispatchEvent(new Event('input'));
        await nextTick();
        expect(document.querySelector('[role="status"]')?.textContent?.trim()).toBe('No results found');
        expect(wrapper.findComponent(Select).emitted('filter')).toHaveLength(2);
    });

    it('renders groups as labelled ARIA groups', async () => {
        const grouped = [
            { label: 'Citrus', items: [{ name: 'Lemon' }, { name: 'Lime' }] },
            { label: 'Berries', items: [{ name: 'Raspberry' }] }
        ];
        const { combobox } = mountSelect({ options: grouped, optionGroupLabel: 'label', optionValue: undefined, optionDisabled: undefined });
        combobox().click();
        await nextTick();
        const groupEls = document.querySelectorAll('[role="group"]');
        expect(groupEls).toHaveLength(2);
        const labelId = groupEls[0]!.getAttribute('aria-labelledby')!;
        expect(document.getElementById(labelId)?.textContent?.trim()).toBe('Citrus');
        await expectNoA11yViolations();
    });

    it('has no accessibility violations, closed or open', async () => {
        const { combobox } = mountSelect({ modelValue: 'ap', showClear: true, checkmark: true });
        await expectNoA11yViolations();
        combobox().click();
        await nextTick();
        await expectNoA11yViolations();
    });
});

import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Listbox from './Listbox.vue';

const cities = [
    { name: 'Lisboa', code: 'LIS' },
    { name: 'Porto', code: 'OPO' },
    { name: 'Braga', code: 'BRG', off: true },
    { name: 'Coimbra', code: 'COI' },
    { name: 'Évora', code: 'EVO' }
];

function mountListbox(props: Record<string, unknown> = {}) {
    const value = ref<unknown>(props.modelValue ?? null);
    const wrapper = mountVt(
        defineComponent(
            () => () =>
                h(Listbox, {
                    'aria-label': 'City',
                    options: cities,
                    optionLabel: 'name',
                    optionValue: 'code',
                    optionDisabled: 'off',
                    ...props,
                    modelValue: value.value,
                    'onUpdate:modelValue': (v: unknown) => (value.value = v)
                })
        )
    );
    const listbox = () => document.querySelector<HTMLElement>('[role="listbox"]')!;
    const options = () => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
    const active = () => document.getElementById(listbox().getAttribute('aria-activedescendant') ?? '')?.textContent?.trim();
    const selected = () => options().filter((o) => o.getAttribute('aria-selected') === 'true').map((o) => o.textContent?.trim());
    return { wrapper, value, listbox, options, active, selected };
}

describe('Listbox', () => {
    it('is one tab stop named by its label, with every option announcing its selected state', () => {
        const { listbox, options } = mountListbox({ modelValue: 'OPO' });
        expect(listbox().tabIndex).toBe(0);
        expect(listbox().getAttribute('aria-label')).toBe('City');
        expect(listbox().hasAttribute('aria-multiselectable')).toBe(false);
        expect(options().map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false', 'false', 'false']);
        expect(options()[2]!.getAttribute('aria-disabled')).toBe('true');
    });

    it('focuses the selected option on entry and lets selection follow the arrows, skipping disabled options', async () => {
        const { listbox, active, value } = mountListbox({ modelValue: 'OPO' });
        listbox().focus();
        await nextTick();
        expect(active()).toBe('Porto');
        await press(listbox(), 'ArrowDown');
        expect(active()).toBe('Coimbra');
        expect(value.value).toBe('COI');
        await press(listbox(), 'End');
        expect(value.value).toBe('EVO');
        await press(listbox(), 'Home');
        expect(value.value).toBe('LIS');
        await press(listbox(), 'ArrowUp');
        expect(active()).toBe('Lisboa');
    });

    it('only moves with the arrows when selection does not follow focus; Enter and Space select', async () => {
        const { listbox, active, value } = mountListbox({ selectOnFocus: false });
        listbox().focus();
        await press(listbox(), 'ArrowDown');
        expect(active()).toBe('Porto');
        expect(value.value).toBeNull();
        await press(listbox(), ' ');
        expect(value.value).toBe('OPO');
        await press(listbox(), 'ArrowDown');
        await press(listbox(), 'Enter');
        expect(value.value).toBe('COI');
    });

    it('jumps by typeahead, ignoring accents', async () => {
        const { listbox, active } = mountListbox();
        listbox().focus();
        await press(listbox(), 'e');
        expect(active()).toBe('Évora');
    });

    it('in multiple mode toggles with Space, extends with Shift+arrows and selects all with Ctrl+A', async () => {
        const { listbox, value, selected } = mountListbox({ multiple: true, modelValue: [] });
        expect(listbox().getAttribute('aria-multiselectable')).toBe('true');
        listbox().focus();
        await press(listbox(), ' ');
        expect(value.value).toEqual(['LIS']);
        await press(listbox(), 'ArrowDown', { shiftKey: true });
        expect(selected()).toEqual(['Lisboa', 'Porto']);
        await press(listbox(), ' ');
        expect(value.value).toEqual(['LIS']);
        await press(listbox(), 'a', { ctrlKey: true });
        expect(selected()).toEqual(['Lisboa', 'Porto', 'Coimbra', 'Évora']);
        await press(listbox(), 'a', { ctrlKey: true });
        expect(value.value).toEqual([]);
    });

    it('selects on click, and a Shift-click selects the range from the last one', async () => {
        const { options, value } = mountListbox({ multiple: true, modelValue: [] });
        options()[0]!.click();
        await nextTick();
        options()[4]!.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
        await nextTick();
        expect(value.value).toEqual(['LIS', 'OPO', 'COI', 'EVO']);
    });

    it('filters with a search box and says when nothing matches', async () => {
        const { options, wrapper } = mountListbox({ filter: true });
        const search = document.querySelector<HTMLInputElement>('[role="searchbox"]')!;
        search.value = 'evo';
        search.dispatchEvent(new Event('input'));
        await nextTick();
        expect(options().map((o) => o.textContent?.trim())).toEqual(['Évora']);
        search.value = 'zzz';
        search.dispatchEvent(new Event('input'));
        await nextTick();
        expect(document.querySelector('[role="status"]')?.textContent?.trim()).toBe('No results found');
        expect(wrapper.findComponent(Listbox).emitted('filter')).toHaveLength(2);
    });

    it('renders groups as labelled ARIA groups', () => {
        const grouped = [
            { label: 'Portugal', items: [{ name: 'Lisboa' }, { name: 'Porto' }] },
            { label: 'Brasil', items: [{ name: 'São Paulo' }] }
        ];
        mountListbox({ options: grouped, optionGroupLabel: 'label', optionValue: undefined, optionDisabled: undefined });
        const groups = document.querySelectorAll('[role="group"]');
        expect(groups).toHaveLength(2);
        expect(document.getElementById(groups[1]!.getAttribute('aria-labelledby')!)?.textContent?.trim()).toBe('Brasil');
    });

    it('leaves the tab order and ignores keys while disabled', async () => {
        const { listbox, value } = mountListbox({ disabled: true });
        expect(listbox().tabIndex).toBe(-1);
        expect(listbox().getAttribute('aria-disabled')).toBe('true');
        await press(listbox(), 'ArrowDown');
        expect(value.value).toBeNull();
    });

    it('has no accessibility violations, single, multiple and grouped', async () => {
        mountListbox({ modelValue: 'LIS', checkmark: true, filter: true });
        await expectNoA11yViolations();
        document.body.innerHTML = '';
        mountListbox({ multiple: true, modelValue: ['LIS', 'COI'], invalid: true });
        await expectNoA11yViolations();
        document.body.innerHTML = '';
        mountListbox({ options: [{ label: 'Portugal', items: [{ name: 'Lisboa' }] }], optionGroupLabel: 'label', optionValue: undefined });
        await expectNoA11yViolations();
    });
});

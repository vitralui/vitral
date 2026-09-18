import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import AutoComplete from './AutoComplete.vue';

const countries = [{ name: 'Brazil' }, { name: 'Bolivia' }, { name: 'Belgium', off: true }, { name: 'Canada' }, { name: 'Chile' }];
const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

function mountAuto(props: Record<string, unknown> = {}) {
    const value = ref<unknown>(props.modelValue ?? null);
    const suggestions = ref<unknown[]>([]);
    const queries: string[] = [];
    const wrapper = mountVt(
        defineComponent(() => () => [
            h('label', { for: 'country' }, 'Country'),
            h(AutoComplete, {
                id: 'country',
                optionLabel: 'name',
                optionDisabled: 'off',
                delay: 0,
                ...props,
                suggestions: suggestions.value,
                modelValue: value.value,
                'onUpdate:modelValue': (v: unknown) => (value.value = v),
                onComplete: ({ query }: { query: string }) => {
                    queries.push(query);
                    suggestions.value = countries.filter((c) => c.name.toLowerCase().startsWith(query.toLowerCase()));
                }
            })
        ])
    );
    const input = () => document.querySelector<HTMLInputElement>('#country')!;
    const options = () => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
    const active = () => document.getElementById(input().getAttribute('aria-activedescendant') ?? '');
    const type = async (text: string) => {
        input().focus();
        input().value = text;
        input().dispatchEvent(new Event('input'));
        await settle();
        await nextTick();
    };
    return { wrapper, value, input, options, active, type, queries };
}

describe('AutoComplete', () => {
    it('is a collapsed editable combobox with list autocomplete, named by its label', () => {
        const { input } = mountAuto();
        expect(input().getAttribute('role')).toBe('combobox');
        expect(input().getAttribute('aria-autocomplete')).toBe('list');
        expect(input().getAttribute('aria-expanded')).toBe('false');
        expect(input().labels?.[0]?.textContent).toBe('Country');
    });

    it('asks for suggestions as the reader types and opens a listbox it controls, announcing the count', async () => {
        const { input, options, type, queries, value } = mountAuto();
        await type('b');
        expect(queries).toEqual(['b']);
        expect(value.value).toBe('b');
        expect(input().getAttribute('aria-expanded')).toBe('true');
        const listbox = document.querySelector('[role="listbox"]')!;
        expect(input().getAttribute('aria-controls')).toBe(listbox.id);
        expect(listbox.getAttribute('aria-labelledby')).toBe(input().labels![0]!.id);
        expect(options().map((o) => o.textContent?.trim())).toEqual(['Brazil', 'Bolivia', 'Belgium']);
        expect(document.querySelector('[role="status"]')?.textContent).toBe('3 results are available');
    });

    it('moves through the suggestions, skipping disabled ones, and takes one with Enter', async () => {
        const { input, active, type, value } = mountAuto();
        await type('b');
        expect(input().hasAttribute('aria-activedescendant')).toBe(false);
        await press(input(), 'ArrowDown');
        expect(active()?.textContent?.trim()).toBe('Brazil');
        await press(input(), 'ArrowDown');
        await press(input(), 'ArrowDown');
        expect(active()?.textContent?.trim()).toBe('Bolivia');
        await press(input(), 'ArrowUp');
        expect(active()?.textContent?.trim()).toBe('Brazil');
        expect(active()?.getAttribute('aria-selected')).toBe('false');
        await press(input(), 'Enter');
        expect(value.value).toEqual({ name: 'Brazil' });
        expect(input().value).toBe('Brazil');
        expect(input().getAttribute('aria-expanded')).toBe('false');
    });

    it('closes on Escape, then clears the box on a second Escape', async () => {
        const { input, type, value } = mountAuto();
        await type('c');
        await press(input(), 'Escape');
        expect(input().getAttribute('aria-expanded')).toBe('false');
        await press(input(), 'Escape');
        expect(input().value).toBe('');
        expect(value.value).toBeNull();
    });

    it('says so when nothing matches', async () => {
        const { type } = mountAuto();
        await type('zz');
        expect(document.querySelector('[role="listbox"]')).toBeNull();
        expect(document.querySelector('.vt-option-empty')?.textContent?.trim()).toBe('No results found');
        expect(document.querySelector('[role="status"]')?.textContent).toBe('No results found');
    });

    it('asks for the whole list from the dropdown button', async () => {
        const { options, queries } = mountAuto({ dropdown: true });
        const button = document.querySelector<HTMLButtonElement>('button[aria-label="Show suggestions"]')!;
        button.click();
        await settle();
        await nextTick();
        expect(queries).toEqual(['']);
        expect(options()).toHaveLength(5);
        expect(document.activeElement?.id).toBe('country');
    });

    it('collects chips in multiple mode, removing the last with Backspace', async () => {
        const { input, type, value, options } = mountAuto({ multiple: true, modelValue: [] });
        await type('c');
        options()[1]!.click();
        await nextTick();
        expect(value.value).toEqual([{ name: 'Chile' }]);
        expect(input().value).toBe('');
        await type('ca');
        await press(input(), 'ArrowDown');
        await press(input(), 'Enter');
        await nextTick();
        expect(value.value).toEqual([{ name: 'Chile' }, { name: 'Canada' }]);
        const chips = document.querySelector('ul[aria-label="Selected items"]')!;
        expect(chips.querySelectorAll('li')).toHaveLength(2);
        expect(chips.querySelectorAll('button')[0]!.getAttribute('aria-label')).toBe('Remove');
        await press(input(), 'Backspace');
        expect(value.value).toEqual([{ name: 'Chile' }]);
        await nextTick();
        chips.querySelector('button')!.click();
        expect(value.value).toEqual([]);
    });

    it('keeps only a chosen suggestion when selection is forced', async () => {
        const { input, type, value } = mountAuto({ forceSelection: true });
        await type('chile');
        expect(value.value).toBeNull();
        input().blur();
        await nextTick();
        expect(value.value).toEqual({ name: 'Chile' });
        await type('chil');
        input().blur();
        await nextTick();
        expect(value.value).toBeNull();
        expect(input().value).toBe('');
    });

    it('has no accessibility violations, closed or open', async () => {
        const { type } = mountAuto({ dropdown: true, showClear: true, modelValue: 'b' });
        await expectNoA11yViolations();
        await type('b');
        await expectNoA11yViolations();
    });

    it('has no accessibility violations with chips', async () => {
        mountAuto({ multiple: true, modelValue: [{ name: 'Chile' }, { name: 'Brazil' }] });
        await expectNoA11yViolations();
    });
});

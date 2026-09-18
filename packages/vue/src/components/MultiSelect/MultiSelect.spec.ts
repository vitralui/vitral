import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import MultiSelect from './MultiSelect.vue';

const langs = [
    { name: 'Go', code: 'go' },
    { name: 'Rust', code: 'rs' },
    { name: 'Ruby', code: 'rb', off: true },
    { name: 'TypeScript', code: 'ts' }
];

function mountMulti(props: Record<string, unknown> = {}) {
    const value = ref<unknown>(props.modelValue ?? []);
    mountVt(
        defineComponent(() => () => [
            h('label', { for: 'langs' }, 'Languages'),
            h(MultiSelect, {
                id: 'langs',
                options: langs,
                optionLabel: 'name',
                optionValue: 'code',
                optionDisabled: 'off',
                placeholder: 'Pick some',
                ...props,
                modelValue: value.value as never,
                'onUpdate:modelValue': (v: unknown) => (value.value = v)
            })
        ])
    );
    const combobox = () => document.querySelector<HTMLButtonElement>('[role="combobox"]')!;
    const listbox = () => document.querySelector<HTMLElement>('[role="listbox"]');
    const options = () => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
    const active = () => document.getElementById(combobox().getAttribute('aria-activedescendant') ?? '');
    return { value, combobox, listbox, options, active };
}

describe('MultiSelect', () => {
    it('is a collapsed combobox named by its label, opening a multi-selectable listbox', async () => {
        const { combobox, listbox } = mountMulti();
        expect(combobox().getAttribute('aria-expanded')).toBe('false');
        expect(combobox().textContent?.trim()).toBe('Pick some');
        combobox().click();
        await nextTick();
        expect(combobox().getAttribute('aria-expanded')).toBe('true');
        expect(listbox()!.getAttribute('aria-multiselectable')).toBe('true');
        expect(listbox()!.getAttribute('aria-labelledby')).toBe(combobox().labels![0]!.id);
    });

    it('toggles options with Enter and Space, staying open, skipping disabled ones', async () => {
        const { combobox, value, active, listbox, options } = mountMulti();
        await press(combobox(), 'ArrowDown');
        expect(active()?.textContent?.trim()).toBe('Go');
        await press(combobox(), ' ');
        expect(value.value).toEqual(['go']);
        await press(combobox(), 'ArrowDown');
        await press(combobox(), 'ArrowDown');
        expect(active()?.textContent?.trim()).toBe('TypeScript');
        await press(combobox(), 'Enter');
        expect(value.value).toEqual(['go', 'ts']);
        expect(listbox()).not.toBeNull();
        expect(options().map((o) => o.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false', 'true']);
        await press(combobox(), 'Enter');
        expect(value.value).toEqual(['go']);
        expect(combobox().textContent?.trim()).toBe('Go');
    });

    it('toggles everything with Ctrl+A and the header box, leaving disabled options alone', async () => {
        const { combobox, value } = mountMulti();
        await press(combobox(), 'ArrowDown');
        await press(combobox(), 'a', { ctrlKey: true });
        expect(value.value).toEqual(['go', 'rs', 'ts']);
        await nextTick();
        const all = document.querySelector<HTMLInputElement>('input[aria-label="Select all"]')!;
        expect(all.checked).toBe(true);
        all.click();
        expect(value.value).toEqual([]);
    });

    it('closes on Escape and Tab, giving focus back', async () => {
        const { combobox, listbox } = mountMulti();
        await press(combobox(), 'ArrowDown');
        await press(combobox(), 'Escape');
        expect(listbox()).toBeNull();
        expect(document.activeElement).toBe(combobox());
        await press(combobox(), 'ArrowDown');
        await press(combobox(), 'Tab');
        expect(listbox()).toBeNull();
    });

    it('filters from a search box that carries the active option', async () => {
        const { combobox, options } = mountMulti({ filter: true });
        combobox().click();
        await nextTick();
        await nextTick();
        const search = document.querySelector<HTMLInputElement>('[role="searchbox"]')!;
        expect(document.activeElement).toBe(search);
        search.value = 'ru';
        search.dispatchEvent(new Event('input'));
        await nextTick();
        expect(options().map((o) => o.textContent?.trim())).toEqual(['Rust', 'Ruby']);
        expect(document.getElementById(search.getAttribute('aria-activedescendant')!)?.textContent?.trim()).toBe('Rust');
        await press(search, 'Tab');
        expect(document.activeElement).toBe(combobox());
    });

    it('summarises past the label limit', async () => {
        const many = mountMulti({ modelValue: ['go', 'rs', 'ts'], maxSelectedLabels: 2 });
        expect(many.combobox().textContent?.trim()).toBe('3 items selected');
    });

    it('shows the choice as chips', () => {
        const { combobox } = mountMulti({ modelValue: ['go', 'ts'], display: 'chip' });
        expect(Array.from(combobox().querySelectorAll('.vt-chip')).map((c) => c.textContent?.trim())).toEqual(['Go', 'TypeScript']);
        expect(combobox().querySelector('button')).toBeNull();
    });

    it('stops at the selection limit', async () => {
        const { combobox, value, options } = mountMulti({ selectionLimit: 1 });
        await press(combobox(), 'ArrowDown');
        await press(combobox(), 'Enter');
        await press(combobox(), 'ArrowDown');
        await press(combobox(), 'Enter');
        expect(value.value).toEqual(['go']);
        expect(options()[1]!.getAttribute('aria-disabled')).toBe('true');
        expect(document.querySelector('input[aria-label="Select all"]')).toBeNull();
    });

    it('has no accessibility violations, closed or open', async () => {
        const { combobox } = mountMulti({ modelValue: ['go'], showClear: true, filter: true });
        await expectNoA11yViolations();
        combobox().click();
        await nextTick();
        await expectNoA11yViolations();
    });
});

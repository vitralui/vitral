import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import CascadeSelect from './CascadeSelect.vue';

const countries = [
    {
        name: 'Brazil',
        states: [
            { name: 'São Paulo', cities: [{ cname: 'Campinas', code: 'CPQ' }, { cname: 'Santos', code: 'SSZ' }] },
            { name: 'Bahia', cities: [{ cname: 'Salvador', code: 'SSA' }] }
        ]
    },
    { name: 'Portugal', states: [{ name: 'Lisboa', cities: [{ cname: 'Sintra', code: 'SNT', off: true }, { cname: 'Cascais', code: 'CSC' }] }] }
];

function mountCascade(props: Record<string, unknown> = {}) {
    const value = ref<unknown>(props.modelValue ?? null);
    mountVt(
        defineComponent(() => () => [
            h('label', { for: 'city' }, 'City'),
            h(CascadeSelect, {
                id: 'city',
                options: countries,
                optionLabel: 'cname',
                optionValue: 'code',
                optionDisabled: 'off',
                optionGroupLabel: 'name',
                optionGroupChildren: ['states', 'cities'],
                placeholder: 'Pick a city',
                ...props,
                modelValue: value.value,
                'onUpdate:modelValue': (v: unknown) => (value.value = v)
            })
        ])
    );
    const combobox = () => document.querySelector<HTMLButtonElement>('[role="combobox"]')!;
    const tree = () => document.querySelector<HTMLElement>('[role="tree"]');
    const active = () => {
        const el = document.getElementById(combobox().getAttribute('aria-activedescendant') ?? '');
        return el ? document.getElementById(el.getAttribute('aria-labelledby')!)?.textContent?.trim() : undefined;
    };
    const key = async (k: string) => {
        await press(combobox(), k);
        await nextTick();
    };
    return { value, combobox, tree, active, key };
}

describe('CascadeSelect', () => {
    it('is a combobox opening a tree of columns, named by its label', async () => {
        const { combobox, tree, key, active } = mountCascade();
        expect(combobox().getAttribute('aria-haspopup')).toBe('tree');
        await key('ArrowDown');
        expect(combobox().getAttribute('aria-expanded')).toBe('true');
        expect(combobox().getAttribute('aria-controls')).toBe(tree()!.id);
        expect(tree()!.getAttribute('aria-labelledby')).toBe(combobox().labels![0]!.id);
        expect(active()).toBe('Brazil');
        const brazil = document.getElementById(combobox().getAttribute('aria-activedescendant')!)!;
        expect(brazil.getAttribute('aria-expanded')).toBe('false');
        expect(brazil.getAttribute('aria-level')).toBe('1');
        expect(brazil.getAttribute('aria-setsize')).toBe('2');
    });

    it('walks down the levels and chooses an option with Enter', async () => {
        const { combobox, key, active, value, tree } = mountCascade();
        await key('Enter');
        await key('ArrowRight');
        expect(active()).toBe('São Paulo');
        expect(document.querySelectorAll('[role="group"]')).toHaveLength(1);
        await key('Enter');
        expect(active()).toBe('Campinas');
        await key('ArrowDown');
        expect(active()).toBe('Santos');
        await key('ArrowLeft');
        expect(active()).toBe('São Paulo');
        await key('ArrowRight');
        await key('End');
        await key('Enter');
        expect(value.value).toBe('SSZ');
        expect(tree()).toBeNull();
        expect(combobox().textContent?.trim()).toBe('Santos');
    });

    it('skips disabled options, and goes back a column on Escape before closing', async () => {
        const { key, active, tree } = mountCascade();
        await key('ArrowDown');
        await key('ArrowDown');
        expect(active()).toBe('Portugal');
        await key('ArrowRight');
        await key('ArrowRight');
        expect(active()).toBe('Cascais');
        await key('Escape');
        expect(active()).toBe('Lisboa');
        expect(tree()).not.toBeNull();
        await key('Escape');
        await key('Escape');
        expect(tree()).toBeNull();
    });

    it('opens on the chosen option, marked selected', async () => {
        const { key, active } = mountCascade({ modelValue: 'SSA' });
        await key('ArrowDown');
        expect(active()).toBe('Salvador');
        const option = document.getElementById(document.querySelector('[role="combobox"]')!.getAttribute('aria-activedescendant')!)!;
        expect(option.getAttribute('aria-selected')).toBe('true');
        expect(option.getAttribute('aria-level')).toBe('3');
    });

    it('opens groups and chooses options with the pointer', async () => {
        const { combobox, value } = mountCascade();
        combobox().click();
        await nextTick();
        const label = (text: string) => Array.from(document.querySelectorAll<HTMLElement>('.vt-option')).find((el) => el.textContent?.trim() === text)!;
        label('Portugal').click();
        await nextTick();
        label('Lisboa').dispatchEvent(new MouseEvent('mouseenter'));
        await nextTick();
        label('Cascais').click();
        expect(value.value).toBe('CSC');
    });

    it('has no accessibility violations, closed or open', async () => {
        const { key } = mountCascade({ modelValue: 'SSA', showClear: true });
        await expectNoA11yViolations();
        await key('ArrowDown');
        await expectNoA11yViolations();
    });
});

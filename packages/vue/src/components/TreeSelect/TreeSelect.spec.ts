import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import type { TreeNodeLike } from '../Tree/types';
import TreeSelect from './TreeSelect.vue';
import type { TreeSelectValue } from './types';

const nodes: TreeNodeLike[] = [
    { key: 'docs', label: 'Documents', children: [{ key: 'cv', label: 'CV.pdf' }, { key: 'tax', label: 'Taxes.xlsx' }] },
    { key: 'music', label: 'Music' }
];

function mountTreeSelect(props: Record<string, unknown> = {}) {
    const value = ref<TreeSelectValue | null>((props.modelValue as TreeSelectValue | undefined) ?? null);
    mountVt(
        defineComponent(() => () => [
            h('label', { for: 'files' }, 'File'),
            h(TreeSelect, {
                id: 'files',
                options: nodes,
                placeholder: 'Pick a file',
                ...props,
                modelValue: value.value,
                'onUpdate:modelValue': (v: TreeSelectValue | null | undefined) => (value.value = v ?? null)
            })
        ])
    );
    const combobox = () => document.querySelector<HTMLButtonElement>('[role="combobox"]')!;
    const tree = () => document.querySelector<HTMLElement>('[role="tree"]');
    const item = (label: string) => Array.from(document.querySelectorAll<HTMLElement>('[role="treeitem"]')).find((el) => document.getElementById(el.getAttribute('aria-labelledby')!)?.textContent?.trim() === label)!;
    const settle = async () => {
        await nextTick();
        await nextTick();
    };
    return { value, combobox, tree, item, settle };
}

describe('TreeSelect', () => {
    it('is a combobox with a tree popup, named by its label', async () => {
        const { combobox, tree, settle } = mountTreeSelect();
        expect(combobox().getAttribute('aria-haspopup')).toBe('tree');
        expect(combobox().getAttribute('aria-expanded')).toBe('false');
        expect(combobox().textContent?.trim()).toBe('Pick a file');
        await press(combobox(), 'ArrowDown');
        await settle();
        expect(combobox().getAttribute('aria-expanded')).toBe('true');
        expect(combobox().getAttribute('aria-controls')).toBe(tree()!.id);
        expect(tree()!.getAttribute('aria-labelledby')).toBe(combobox().labels![0]!.id);
        expect(document.activeElement?.getAttribute('role')).toBe('treeitem');
    });

    it('chooses a node with the tree keys and closes, giving focus back', async () => {
        const { combobox, value, tree, item, settle } = mountTreeSelect();
        await press(combobox(), 'Enter');
        await settle();
        await press(document.activeElement!, 'ArrowRight');
        await settle();
        await press(document.activeElement!, 'ArrowDown');
        await settle();
        expect(document.activeElement).toBe(item('CV.pdf'));
        await press(document.activeElement!, 'Enter');
        await settle();
        expect(value.value).toEqual({ cv: true });
        expect(tree()).toBeNull();
        expect(document.activeElement).toBe(combobox());
        expect(combobox().textContent?.trim()).toBe('CV.pdf');
    });

    it('stays open for checkbox selection and closes on Escape and Tab', async () => {
        const { combobox, value, tree, item, settle } = mountTreeSelect({ selectionMode: 'checkbox', expandedKeys: { docs: true }, display: 'chip' });
        combobox().click();
        await settle();
        (item('Documents').firstElementChild as HTMLElement).click();
        await settle();
        expect(value.value).toMatchObject({ docs: { checked: true }, cv: { checked: true }, tax: { checked: true } });
        expect(tree()).not.toBeNull();
        await press(document.activeElement!, 'Escape');
        await settle();
        expect(tree()).toBeNull();
        expect(document.activeElement).toBe(combobox());
        expect(Array.from(combobox().querySelectorAll('.vt-chip')).map((c) => c.textContent?.trim())).toEqual(['Documents', 'CV.pdf', 'Taxes.xlsx']);
        await press(combobox(), ' ');
        await settle();
        await press(document.activeElement!, 'Tab');
        await settle();
        expect(tree()).toBeNull();
    });

    it('moves focus to the search box when filtering, and clears from the keyboard', async () => {
        const { combobox, value, settle } = mountTreeSelect({ filter: true, showClear: true, modelValue: { music: true } });
        await press(combobox(), 'ArrowDown');
        await settle();
        expect(document.activeElement?.getAttribute('role')).toBe('searchbox');
        await press(document.activeElement!, 'Escape');
        await settle();
        await press(combobox(), 'Delete');
        expect(value.value).toEqual({});
    });

    it('has no accessibility violations, closed or open', async () => {
        const { combobox, settle } = mountTreeSelect({ modelValue: { music: true }, showClear: true });
        await expectNoA11yViolations();
        combobox().click();
        await settle();
        await expectNoA11yViolations();
    });
});

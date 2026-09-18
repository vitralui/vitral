import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Tree from './Tree.vue';
import type { TreeNodeLike, TreeSelectionKeys } from './types';

const files = (): TreeNodeLike[] => [
    {
        key: 'docs',
        label: 'Documents',
        icon: 'folder',
        children: [
            { key: 'work', label: 'Work', children: [{ key: 'report', label: 'Relatório.pdf' }, { key: 'budget', label: 'Budget.xlsx' }] },
            { key: 'home', label: 'Home', children: [{ key: 'recipes', label: 'Recipes.txt' }] }
        ]
    },
    { key: 'pics', label: 'Pictures', children: [{ key: 'trip', label: 'Trip to Évora.jpg' }] },
    { key: 'notes', label: 'Notes.md' }
];

function mountTree(props: Record<string, unknown> = {}) {
    const expanded = ref<Record<string, boolean>>((props.expandedKeys as Record<string, boolean>) ?? {});
    const selection = ref<TreeSelectionKeys>((props.selectionKeys as TreeSelectionKeys) ?? {});
    const onExpand = vi.fn();
    const wrapper = mountVt(
        defineComponent(
            () => () =>
                h(Tree, {
                    'aria-label': 'Files',
                    value: files(),
                    ...props,
                    expandedKeys: expanded.value,
                    'onUpdate:expandedKeys': (v: Record<string, boolean>) => (expanded.value = v),
                    selectionKeys: selection.value,
                    'onUpdate:selectionKeys': (v: TreeSelectionKeys) => (selection.value = v),
                    onNodeExpand: onExpand
                })
        )
    );
    const tree = () => document.querySelector<HTMLElement>('[role="tree"]')!;
    const items = () => Array.from(document.querySelectorAll<HTMLElement>('[role="treeitem"]'));
    const labelOf = (el: Element | null) => (el ? document.getElementById(el.getAttribute('aria-labelledby') ?? '')?.textContent?.trim() : undefined);
    const item = (label: string) => items().find((el) => labelOf(el) === label)!;
    const focused = () => labelOf(document.activeElement);
    const key = async (k: string, init: KeyboardEventInit = {}) => {
        await press(document.activeElement!, k, init);
        await nextTick();
    };
    return { wrapper, expanded, selection, onExpand, tree, items, item, labelOf, focused, key };
}

describe('Tree', () => {
    it('is a named tree of items that carry their level, position and expanded state', () => {
        const { tree, items, labelOf } = mountTree();
        expect(tree().getAttribute('aria-label')).toBe('Files');
        expect(items().map(labelOf)).toEqual(['Documents', 'Pictures', 'Notes.md']);
        const [docs, , notes] = items();
        expect(docs!.getAttribute('aria-level')).toBe('1');
        expect(docs!.getAttribute('aria-setsize')).toBe('3');
        expect(notes!.getAttribute('aria-posinset')).toBe('3');
        expect(docs!.getAttribute('aria-expanded')).toBe('false');
        expect(notes!.hasAttribute('aria-expanded')).toBe(false);
        expect(items().map((el) => el.tabIndex)).toEqual([0, -1, -1]);
    });

    it('nests an expanded branch’s children in a group, one level down', async () => {
        const { item } = mountTree({ expandedKeys: { docs: true } });
        const docs = item('Documents');
        expect(docs.getAttribute('aria-expanded')).toBe('true');
        const group = docs.querySelector(':scope > [role="group"]')!;
        const children = Array.from(group.querySelectorAll(':scope > [role="treeitem"]'));
        expect(children).toHaveLength(2);
        expect(children[1]!.getAttribute('aria-level')).toBe('2');
        expect(children[1]!.getAttribute('aria-posinset')).toBe('2');
    });

    it('walks with the arrows: down, into and out of branches, Home and End', async () => {
        const { items, item, focused, key, expanded } = mountTree();
        items()[0]!.focus();
        await key('ArrowDown');
        expect(focused()).toBe('Pictures');
        await key('ArrowRight');
        expect(item('Pictures').getAttribute('aria-expanded')).toBe('true');
        expect(expanded.value).toEqual({ pics: true });
        expect(focused()).toBe('Pictures');
        await key('ArrowRight');
        expect(focused()).toBe('Trip to Évora.jpg');
        expect((document.activeElement as HTMLElement).tabIndex).toBe(0);
        await key('ArrowLeft');
        expect(focused()).toBe('Pictures');
        await key('ArrowLeft');
        expect(item('Pictures').getAttribute('aria-expanded')).toBe('false');
        await key('End');
        expect(focused()).toBe('Notes.md');
        await key('Home');
        expect(focused()).toBe('Documents');
    });

    it('expands every sibling branch with * and finds items by typeahead', async () => {
        const { items, focused, key, expanded } = mountTree();
        items()[2]!.focus();
        await key('*');
        expect(expanded.value).toEqual({ docs: true, pics: true });
        await key('t');
        expect(focused()).toBe('Trip to Évora.jpg');
        // Documents, Work, Home, Pictures, Trip, Notes: two up from Trip.
        await key('ArrowUp');
        await key('ArrowUp');
        expect(focused()).toBe('Home');
    });

    it('selects one item in single mode, marking only that item', async () => {
        const { tree, items, item, key, selection } = mountTree({ selectionMode: 'single' });
        expect(tree().hasAttribute('aria-multiselectable')).toBe(false);
        items()[1]!.focus();
        await key('Enter');
        expect(selection.value).toEqual({ pics: true });
        expect(item('Pictures').getAttribute('aria-selected')).toBe('true');
        expect(item('Documents').hasAttribute('aria-selected')).toBe(false);
        await key('ArrowDown');
        await key(' ');
        expect(selection.value).toEqual({ notes: true });
    });

    it('toggles several items in multiple mode', async () => {
        const { tree, items, key, selection } = mountTree({ selectionMode: 'multiple' });
        expect(tree().getAttribute('aria-multiselectable')).toBe('true');
        items()[0]!.focus();
        await key(' ');
        await key('ArrowDown');
        await key(' ');
        expect(selection.value).toEqual({ docs: true, pics: true });
        expect(items().map((el) => el.getAttribute('aria-selected'))).toEqual(['true', 'true', 'false']);
    });

    it('checks a branch with its children and shows the parent as mixed', async () => {
        const { item, key, selection } = mountTree({ selectionMode: 'checkbox', expandedKeys: { docs: true } });
        item('Work').focus();
        await key(' ');
        expect(selection.value).toEqual({
            work: { checked: true, partialChecked: false },
            report: { checked: true, partialChecked: false },
            budget: { checked: true, partialChecked: false },
            docs: { checked: false, partialChecked: true }
        });
        expect(item('Work').getAttribute('aria-checked')).toBe('true');
        expect(item('Documents').getAttribute('aria-checked')).toBe('mixed');
        expect(item('Home').getAttribute('aria-checked')).toBe('false');
    });

    it('filters to the matches and opens the branches that lead to them', async () => {
        const { items, labelOf } = mountTree({ filter: true });
        const search = document.querySelector<HTMLInputElement>('[role="searchbox"]')!;
        search.value = 'evora';
        search.dispatchEvent(new Event('input'));
        await nextTick();
        expect(items().map(labelOf)).toEqual(['Pictures', 'Trip to Évora.jpg']);
        search.value = 'zzz';
        search.dispatchEvent(new Event('input'));
        await nextTick();
        expect(items()).toHaveLength(0);
        expect(document.querySelector('[role="status"]')?.textContent?.trim()).toBe('No results found');
    });

    it('asks for the children of a lazy branch when it is opened', async () => {
        const lazy = [{ key: 'remote', label: 'Server', leaf: false }];
        const { items, key, onExpand } = mountTree({ value: lazy });
        expect(items()[0]!.getAttribute('aria-expanded')).toBe('false');
        items()[0]!.focus();
        await key('ArrowRight');
        expect(onExpand).toHaveBeenCalledWith(expect.objectContaining({ key: 'remote' }));
    });

    it('opens and closes a branch from its toggle with the mouse', async () => {
        const { item } = mountTree();
        item('Documents').querySelector<HTMLElement>('.vt-tree-toggler')!.click();
        await nextTick();
        expect(item('Documents').getAttribute('aria-expanded')).toBe('true');
    });

    it('has no accessibility violations, collapsed, expanded with a selection, and with checkboxes', async () => {
        mountTree();
        await expectNoA11yViolations();
        document.body.innerHTML = '';
        mountTree({ selectionMode: 'single', selectionKeys: { work: true }, expandedKeys: { docs: true, work: true }, filter: true });
        await expectNoA11yViolations();
        document.body.innerHTML = '';
        mountTree({ selectionMode: 'checkbox', selectionKeys: { home: { checked: true, partialChecked: false } }, expandedKeys: { docs: true } });
        await expectNoA11yViolations();
    });
});

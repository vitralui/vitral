import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import type { MenuItem } from '../Menu/types';
import PanelMenu from './PanelMenu.vue';

function mountPanels(props: Record<string, unknown> = {}, run = vi.fn()) {
    const expanded = ref<Record<string, boolean>>({});
    const model: MenuItem[] = [
        {
            label: 'Files',
            key: 'files',
            items: [
                { label: 'Documents', key: 'docs', items: [{ label: 'Invoice', command: run }, { label: 'Resume', command: run }] },
                { label: 'Images', key: 'img', command: run },
                { label: 'Online', key: 'online', url: '#online' }
            ]
        },
        { label: 'Cloud', key: 'cloud', items: [{ label: 'Upload', command: run }] },
        { label: 'Sign out', key: 'out', command: run }
    ];
    mountVt(
        defineComponent(() => () =>
            h(PanelMenu, { model, ...props, expandedKeys: expanded.value, 'onUpdate:expandedKeys': (v: Record<string, boolean>) => (expanded.value = v) })
        )
    );
    const header = (label: string) => Array.from(document.querySelectorAll<HTMLElement>('.vt-panelmenu-header')).find((el) => el.textContent?.trim() === label)!;
    const item = (label: string) =>
        Array.from(document.querySelectorAll<HTMLElement>('[role="treeitem"]')).find((el) => document.getElementById(el.getAttribute('aria-labelledby')!)?.textContent?.trim() === label)!;
    const key = async (k: string) => {
        await press(document.activeElement!, k);
        await nextTick();
        await nextTick();
    };
    return { expanded, header, item, key, run };
}

describe('PanelMenu', () => {
    it('has section headers that are buttons expanding a labelled tree', async () => {
        const { header, expanded } = mountPanels();
        expect(header('Files').tagName).toBe('BUTTON');
        expect(header('Files').getAttribute('aria-expanded')).toBe('false');
        expect(header('Sign out').hasAttribute('aria-expanded')).toBe(false);
        header('Files').click();
        await nextTick();
        expect(expanded.value).toEqual({ files: true });
        const region = document.getElementById(header('Files').getAttribute('aria-controls')!)!;
        const tree = region.querySelector('[role="tree"]')!;
        expect(tree.getAttribute('aria-labelledby')).toBe(header('Files').id);
    });

    it('keeps one section open unless multiple, and moves between headers with the arrows', async () => {
        const { header, expanded, key } = mountPanels();
        header('Files').click();
        await nextTick();
        header('Cloud').click();
        await nextTick();
        expect(expanded.value).toEqual({ cloud: true });
        header('Cloud').focus();
        await key('ArrowDown');
        expect(document.activeElement).toBe(header('Sign out'));
        await key('Home');
        expect(document.activeElement).toBe(header('Files'));
    });

    it('walks its tree with the tree keys and runs items', async () => {
        const { header, item, key, run, expanded } = mountPanels();
        header('Files').click();
        await nextTick();
        const docs = item('Documents');
        expect(docs.tabIndex).toBe(0);
        docs.focus();
        await key('ArrowRight');
        expect(expanded.value.docs).toBe(true);
        expect(item('Documents').getAttribute('aria-expanded')).toBe('true');
        await key('ArrowRight');
        expect(document.activeElement).toBe(item('Invoice'));
        expect(item('Invoice').getAttribute('aria-level')).toBe('2');
        await key('Enter');
        expect(run).toHaveBeenCalledTimes(1);
        await key('ArrowLeft');
        expect(document.activeElement).toBe(item('Documents'));
        await key('ArrowLeft');
        expect(item('Invoice')).toBeUndefined();
        await key('i');
        expect(document.activeElement).toBe(item('Images'));
        await key(' ');
        expect(run).toHaveBeenCalledTimes(2);
    });

    it('runs a header without items as a command', async () => {
        const { header, run } = mountPanels();
        header('Sign out').click();
        expect(run).toHaveBeenCalledTimes(1);
    });

    it('has no accessibility violations, collapsed or expanded', async () => {
        const { header, item } = mountPanels({ multiple: true });
        await expectNoA11yViolations();
        header('Files').click();
        await nextTick();
        item('Documents').click();
        await nextTick();
        await expectNoA11yViolations();
    });
});

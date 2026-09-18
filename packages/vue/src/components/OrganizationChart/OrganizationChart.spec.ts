import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import OrganizationChart from './OrganizationChart.vue';
import type { OrganizationChartNode } from './types';

const chart: OrganizationChartNode = {
    key: 'ceo',
    label: 'CEO',
    children: [
        { key: 'cto', label: 'CTO', type: 'person', children: [{ key: 'dev', label: 'Developers' }] },
        { key: 'cfo', label: 'CFO', selectable: false }
    ]
};

function mountChart(props: Record<string, unknown> = {}) {
    const selection = ref<Record<string, boolean>>({});
    const collapsed = ref<Record<string, boolean>>({});
    mountVt(
        defineComponent(() => () =>
            h(
                OrganizationChart,
                {
                    value: chart,
                    'aria-label': 'Company',
                    ...props,
                    selectionKeys: selection.value,
                    'onUpdate:selectionKeys': (v: Record<string, boolean>) => (selection.value = v),
                    collapsedKeys: collapsed.value,
                    'onUpdate:collapsedKeys': (v: Record<string, boolean>) => (collapsed.value = v)
                },
                { person: ({ node }: { node: OrganizationChartNode }) => h('em', node.label) }
            )
        )
    );
    const item = (label: string) =>
        Array.from(document.querySelectorAll<HTMLElement>('[role="treeitem"]')).find((el) => document.getElementById(el.getAttribute('aria-labelledby')!)?.firstChild?.textContent === label)!;
    const key = async (k: string) => {
        await press(document.activeElement!, k);
        await nextTick();
        await nextTick();
    };
    return { selection, collapsed, item, key };
}

describe('OrganizationChart', () => {
    it('is a named tree of nested groups, rendering nodes by type', () => {
        const { item } = mountChart();
        const tree = document.querySelector('[role="tree"]')!;
        expect(tree.getAttribute('aria-label')).toBe('Company');
        expect(item('CEO').getAttribute('aria-level')).toBe('1');
        expect(item('CEO').tabIndex).toBe(0);
        expect(item('CTO').querySelector('em')?.textContent).toBe('CTO');
        expect(item('CTO').getAttribute('aria-posinset')).toBe('1');
        expect(item('CTO').getAttribute('aria-setsize')).toBe('2');
    });

    it('walks the chart with the tree keys and folds nodes', async () => {
        const { item, key, collapsed } = mountChart({ collapsible: true });
        item('CEO').focus();
        await key('ArrowDown');
        expect(document.activeElement).toBe(item('CTO'));
        await key('ArrowDown');
        expect(document.activeElement).toBe(item('Developers'));
        await key('ArrowLeft');
        expect(document.activeElement).toBe(item('CTO'));
        await key('ArrowLeft');
        expect(collapsed.value).toEqual({ cto: true });
        expect(item('CTO').getAttribute('aria-expanded')).toBe('false');
        expect(item('Developers')).toBeUndefined();
        await key('ArrowRight');
        expect(item('Developers')).toBeDefined();
        await key('End');
        expect(document.activeElement).toBe(item('CFO'));
    });

    it('selects with Enter and the pointer, leaving unselectable nodes alone', async () => {
        const { item, key, selection } = mountChart({ selectionMode: 'multiple' });
        expect(document.querySelector('[role="tree"]')!.getAttribute('aria-multiselectable')).toBe('true');
        item('CEO').focus();
        await key('Enter');
        expect(selection.value).toEqual({ ceo: true });
        (item('CTO').firstElementChild as HTMLElement).click();
        await nextTick();
        expect(selection.value).toEqual({ ceo: true, cto: true });
        (item('CFO').firstElementChild as HTMLElement).click();
        expect(selection.value).toEqual({ ceo: true, cto: true });
        expect(item('CFO').hasAttribute('aria-selected')).toBe(false);
    });

    it('has no accessibility violations', async () => {
        mountChart({ selectionMode: 'single', collapsible: true });
        await expectNoA11yViolations();
    });
});

import { ptBR } from '@vitral/core';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Spreadsheet from './Spreadsheet.vue';

// The grid itself is `@vitral/spreadsheet`, tested there. This is the wrapping:
// the props going in, the model coming back, and the Vitral configuration.

const invoice = { A1: 'Desk', B1: 320, C1: 2, D1: '=B1*C1', A2: 'Chair', B2: 95.5, C2: 4, D2: '=B2*C2', D3: '=SUM(D1:D2)' };

function mountSheet(props: Record<string, unknown> = {}, vitral?: Record<string, unknown>) {
    const cells = ref<Record<string, string | number | boolean | null>>({ ...invoice });
    const changed = vi.fn();
    const moved = vi.fn();
    const wrapper = mountVt(
        defineComponent(() => () =>
            h(Spreadsheet, {
                rows: 20,
                columns: 6,
                modelValue: cells.value,
                'onUpdate:modelValue': (...args: unknown[]) => (cells.value = args[0] as Record<string, string>),
                onChange: changed,
                onSelectionChange: moved,
                ...props
            })
        ),
        {},
        { theme: 'none', ...vitral } as never
    );
    const root = wrapper.element as HTMLElement;
    const grid = () => root.querySelector<HTMLElement>('[role="grid"]')!;
    return {
        root,
        cells,
        changed,
        moved,
        grid,
        cell: (address: string) => root.querySelector<HTMLElement>(`#${grid().id}-${Number(address.slice(1)) - 1}-${address.charCodeAt(0) - 65}`),
        editor: () => root.querySelector<HTMLInputElement>('.vt-spreadsheet-editor')
    };
}

const key = (element: Element, name: string, init: KeyboardEventInit = {}) =>
    element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }));

describe('Spreadsheet', () => {
    it('hands the addon its cells, and shows what they come to', () => {
        const { root, cell } = mountSheet({ ariaLabel: 'Invoice' });
        // The element the component renders is the sheet's own root.
        expect(root.classList.contains('vt-spreadsheet')).toBe(true);
        expect(root.querySelector('[role="grid"]')!.getAttribute('aria-label')).toBe('Invoice');
        expect(cell('D1')!.textContent).toBe('640');
        expect(cell('D3')!.textContent).toBe('1022');
    });

    it('gives what was typed back through v-model, formulas and all', async () => {
        const { grid, cells, editor, changed, cell } = mountSheet();
        key(grid(), '9');
        await nextTick();
        editor()!.value = '5';
        editor()!.dispatchEvent(new Event('input', { bubbles: true }));
        key(editor()!, 'Enter');
        await nextTick();
        expect(cells.value.A1).toBe('5');
        // The formulas come back as formulas, not as what they worked out to.
        expect(cells.value.D3).toBe('=SUM(D1:D2)');
        expect(changed).toHaveBeenCalledTimes(1);
        expect(cell('A1')!.textContent).toBe('5');
    });

    it('takes cells changed from the outside', async () => {
        const { cells, cell } = mountSheet();
        cells.value = { ...cells.value, C1: 10 };
        await nextTick();
        expect(cell('D1')!.textContent).toBe('3200');
        // And a sheet it is handed afresh is the sheet it draws.
        cells.value = { A1: 'Only this' };
        await nextTick();
        expect(cell('A1')!.textContent).toBe('Only this');
        expect(cell('D1')!.textContent).toBe('');
    });

    it('says where the keyboard went', async () => {
        const { grid, moved } = mountSheet();
        key(grid(), 'ArrowDown');
        await nextTick();
        expect(moved).toHaveBeenLastCalledWith(expect.objectContaining({ address: 'A2' }));
    });

    it('leaves a read-only sheet alone', async () => {
        const { grid, cells, editor } = mountSheet({ readonly: true });
        key(grid(), '9');
        await nextTick();
        expect(editor()).toBeNull();
        key(grid(), 'Delete');
        await nextTick();
        expect(cells.value.A1).toBe('Desk');
    });

    it('takes the Vitral configuration: the locale, unstyled and pass-through', async () => {
        const plain = mountSheet({ unstyled: true });
        expect(plain.root.classList.contains('vt-spreadsheet')).toBe(false);
        expect(plain.root.querySelector('[role="grid"]')).not.toBeNull();

        const { root } = mountSheet({ pt: { root: { 'data-mine': 'yes' } } }, { locale: ptBR });
        expect(root.getAttribute('data-mine')).toBe('yes');
        expect(root.querySelector('[role="grid"]')!.getAttribute('aria-label')).toBe('Planilha');
    });

    it('draws the toolbar, and takes the groups it is given', async () => {
        const { root, cells, grid } = mountSheet({ toolbar: [['bold', 'italic']] });
        const tools = () => [...root.querySelectorAll<HTMLButtonElement>('[role="toolbar"] .vt-spreadsheet-button')];
        expect(tools().map((button) => button.getAttribute('aria-label'))).toEqual(['Bold', 'Italic']);
        tools()[0]!.click();
        await nextTick();
        expect(root.querySelector('[role="gridcell"]')!.className).toContain('vt-spreadsheet-cell-bold');
        expect(grid()).not.toBeNull();
        expect(cells).toBeTruthy();
    });

    it('takes a bar of its own from the slot', () => {
        const wrapper = mountVt(
            defineComponent(() => () => h(Spreadsheet, { rows: 6, columns: 3 }, { toolbar: () => h('button', { class: 'mine' }, 'My tool') }))
        );
        const root = wrapper.element as HTMLElement;
        expect(root.querySelector('.mine')).not.toBeNull();
        expect(root.querySelector('[role="toolbar"]')).toBeNull();
    });

    it('leaves the bars out when they are not wanted', () => {
        const { root } = mountSheet({ formulaBar: false, toolbar: false });
        expect(root.querySelector('.vt-spreadsheet-bar')).toBeNull();
        expect(root.querySelector('[role="toolbar"]')).toBeNull();
    });

    it('has nothing axe objects to', async () => {
        mountSheet({ ariaLabel: 'Invoice' });
        await expectNoA11yViolations(document.body);
    });
});

import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import OrderList from './OrderList.vue';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function mountOrder(props: Record<string, unknown> = {}) {
    const list = ref<unknown[]>([{ name: 'Alpha' }, { name: 'Bravo' }, { name: 'Charlie' }, { name: 'Delta' }]);
    const selection = ref<unknown[]>([]);
    mountVt(
        defineComponent(() => () =>
            h(OrderList, {
                header: 'Priorities',
                optionLabel: 'name',
                ...props,
                modelValue: list.value,
                'onUpdate:modelValue': (v: unknown[]) => (list.value = v),
                selection: selection.value,
                'onUpdate:selection': (v: unknown[]) => (selection.value = v)
            })
        )
    );
    const listbox = () => document.querySelector<HTMLElement>('[role="listbox"]')!;
    const names = () => (list.value as { name: string }[]).map((i) => i.name);
    const button = (label: string) => document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
    const status = () => document.querySelector('[role="status"]')!.textContent;
    const active = () => document.getElementById(listbox().getAttribute('aria-activedescendant') ?? '')?.textContent?.trim();
    return { list, selection, listbox, names, button, status, active };
}

describe('OrderList', () => {
    it('is a multi-selectable listbox named by its header and described by the reorder keys', () => {
        const { listbox } = mountOrder();
        expect(listbox().getAttribute('aria-multiselectable')).toBe('true');
        expect(document.getElementById(listbox().getAttribute('aria-labelledby')!)?.textContent?.trim()).toBe('Priorities');
        expect(document.getElementById(listbox().getAttribute('aria-describedby')!)?.textContent).toContain('Alt');
    });

    it('selects with Space and moves with Alt and the arrows, announcing where the item went', async () => {
        const { listbox, names, selection, status, active } = mountOrder();
        listbox().focus();
        await nextTick();
        expect(active()).toBe('Alpha');
        await press(listbox(), 'ArrowDown');
        await press(listbox(), ' ');
        expect(selection.value).toEqual([{ name: 'Bravo' }]);
        await press(listbox(), 'ArrowUp', { altKey: true });
        await settle();
        expect(names()).toEqual(['Bravo', 'Alpha', 'Charlie', 'Delta']);
        expect(status()).toBe('Bravo moved to position 1 of 4');
        expect(active()).toBe('Bravo');
        await press(listbox(), 'End', { altKey: true });
        await settle();
        expect(names()).toEqual(['Alpha', 'Charlie', 'Delta', 'Bravo']);
        expect(status()).toBe('Bravo moved to position 4 of 4');
    });

    it('moves the active item when nothing is selected', async () => {
        const { listbox, names, selection } = mountOrder();
        listbox().focus();
        await nextTick();
        await press(listbox(), 'ArrowDown');
        await press(listbox(), 'ArrowDown', { altKey: true });
        await settle();
        expect(names()).toEqual(['Alpha', 'Charlie', 'Bravo', 'Delta']);
        expect(selection.value).toEqual([{ name: 'Bravo' }]);
    });

    it('moves the active item, not an older selection, when the active item is not selected', async () => {
        const { listbox, names, selection } = mountOrder();
        listbox().focus();
        await nextTick();
        await press(listbox(), ' ');
        expect(selection.value).toEqual([{ name: 'Alpha' }]);
        await press(listbox(), 'ArrowDown');
        await press(listbox(), 'ArrowDown');
        await press(listbox(), 'ArrowUp', { altKey: true });
        await settle();
        expect(names()).toEqual(['Alpha', 'Charlie', 'Bravo', 'Delta']);
        expect(selection.value).toEqual([{ name: 'Charlie' }]);
    });

    it('moves a selection with the buttons, which say what they do', async () => {
        const { listbox, names, button, status } = mountOrder();
        expect(button('Move up').disabled).toBe(true);
        (listbox().children[2] as HTMLElement).click();
        (listbox().children[3] as HTMLElement).dispatchEvent(new MouseEvent('click', { shiftKey: true }));
        await nextTick();
        expect(button('Move to top').getAttribute('aria-controls')).toBe(listbox().id);
        button('Move to top').click();
        await settle();
        expect(names()).toEqual(['Charlie', 'Delta', 'Alpha', 'Bravo']);
        expect(status()).toBe('2 items moved, first now at position 1 of 4');
    });

    it('selects all with Ctrl+A and moves an item by dropping it', async () => {
        const { listbox, selection, names } = mountOrder();
        listbox().focus();
        await press(listbox(), 'a', { ctrlKey: true });
        expect(selection.value).toHaveLength(4);
        const options = listbox().children;
        options[0]!.dispatchEvent(new Event('dragstart'));
        const over = new Event('dragover', { cancelable: true }) as DragEvent;
        Object.defineProperty(over, 'clientY', { value: 10 });
        options[2]!.getBoundingClientRect = () => ({ top: 0, height: 10 }) as DOMRect;
        options[2]!.dispatchEvent(over);
        options[2]!.dispatchEvent(new Event('drop'));
        await settle();
        expect(names()).toEqual(['Bravo', 'Charlie', 'Alpha', 'Delta']);
    });

    it('has no accessibility violations', async () => {
        const { listbox } = mountOrder();
        listbox().focus();
        await expectNoA11yViolations();
    });
});

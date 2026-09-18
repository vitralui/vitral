import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import PickList from './PickList.vue';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function mountPick(props: Record<string, unknown> = {}) {
    const lists = ref<[unknown[], unknown[]]>([['Go', 'Rust', 'Zig'], ['Vue']]);
    const selection = ref<[unknown[], unknown[]]>([[], []]);
    mountVt(
        defineComponent(() => () =>
            h(PickList, {
                ...props,
                modelValue: lists.value,
                'onUpdate:modelValue': (v: [unknown[], unknown[]]) => (lists.value = v),
                selection: selection.value,
                'onUpdate:selection': (v: [unknown[], unknown[]]) => (selection.value = v)
            })
        )
    );
    const listboxes = () => Array.from(document.querySelectorAll<HTMLElement>('[role="listbox"]'));
    const button = (label: string) => document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
    const status = () => document.querySelector('[role="status"]')!.textContent;
    return { lists, selection, listboxes, button, status };
}

describe('PickList', () => {
    it('is two listboxes named by their headers, with transfer buttons that name their move', () => {
        const { listboxes, button } = mountPick();
        const [source, target] = listboxes();
        expect(document.getElementById(source!.getAttribute('aria-labelledby')!)?.textContent?.trim()).toBe('Available');
        expect(document.getElementById(target!.getAttribute('aria-labelledby')!)?.textContent?.trim()).toBe('Selected');
        expect(button('Move to target').getAttribute('aria-controls')).toBe(target!.id);
        expect(button('Move to target').disabled).toBe(true);
        expect(button('Move all to source').disabled).toBe(false);
        expect(button('Move up (Available)')).not.toBeNull();
    });

    it('sends the active item across with Enter and announces it', async () => {
        const { listboxes, lists, status, selection } = mountPick();
        const source = listboxes()[0]!;
        source.focus();
        await nextTick();
        await press(source, 'ArrowDown');
        await press(source, 'Enter');
        await settle();
        expect(lists.value).toEqual([['Go', 'Zig'], ['Vue', 'Rust']]);
        expect(selection.value).toEqual([[], ['Rust']]);
        expect(status()).toBe('Rust moved to Selected');
    });

    it('moves a selection and everything with the buttons', async () => {
        const { listboxes, lists, button, status } = mountPick();
        (listboxes()[0]!.children[0] as HTMLElement).click();
        await nextTick();
        (listboxes()[0]!.children[2] as HTMLElement).dispatchEvent(new MouseEvent('click', { ctrlKey: true }));
        await nextTick();
        button('Move to target').click();
        await settle();
        expect(lists.value).toEqual([['Rust'], ['Vue', 'Go', 'Zig']]);
        expect(status()).toBe('2 moved to Selected');
        button('Move all to source').click();
        await settle();
        expect(lists.value).toEqual([['Rust', 'Vue', 'Go', 'Zig'], []]);
    });

    it('reorders within a list with Alt and the arrows', async () => {
        const { listboxes, lists, status } = mountPick();
        const source = listboxes()[0]!;
        source.focus();
        await nextTick();
        await press(source, 'End');
        await press(source, 'ArrowUp', { altKey: true });
        await settle();
        expect(lists.value[0]).toEqual(['Go', 'Zig', 'Rust']);
        expect(status()).toBe('Zig moved to position 2 of 3');
    });

    it('transfers on a double click', async () => {
        const { listboxes, lists } = mountPick();
        (listboxes()[1]!.children[0] as HTMLElement).dispatchEvent(new MouseEvent('dblclick'));
        await settle();
        expect(lists.value).toEqual([['Go', 'Rust', 'Zig', 'Vue'], []]);
    });

    it('has no accessibility violations', async () => {
        mountPick({ sourceHeader: 'Languages', targetHeader: 'Stack' });
        await expectNoA11yViolations();
    });
});

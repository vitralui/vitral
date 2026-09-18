import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Taskboard from './Taskboard.vue';
import type { TaskboardColumn } from './types';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

interface Card {
    id: number;
    title: string;
    column: string;
    lane?: string;
    locked?: boolean;
}

function mountFlat(props: Record<string, unknown> = {}) {
    const items = ref<Card[]>([
        { id: 1, title: 'Write spec', column: 'todo', lane: 'web' },
        { id: 2, title: 'Fix bug', column: 'todo', lane: 'api' },
        { id: 3, title: 'Review', column: 'doing', lane: 'web' },
        { id: 4, title: 'Ship', column: 'done', lane: 'web', locked: true }
    ]);
    const columns = ref<TaskboardColumn[]>([
        { key: 'todo', title: 'To do' },
        { key: 'doing', title: 'Doing', wipLimit: 1 },
        { key: 'done', title: 'Done' }
    ]);
    const onMove = vi.fn();
    const onRefused = vi.fn();
    const onColumnMove = vi.fn();
    const onClick = vi.fn();
    mountVt(
        defineComponent(() => () =>
            h(Taskboard, {
                ...props,
                columns: columns.value,
                'onUpdate:columns': (v: TaskboardColumn[]) => (columns.value = v),
                items: items.value,
                'onUpdate:items': (v: unknown[]) => (items.value = v as Card[]),
                onCardMove: onMove,
                onDropRefused: onRefused,
                onColumnMove: onColumnMove,
                onCardClick: onClick
            })
        )
    );
    const card = (title: string) => [...document.querySelectorAll<HTMLElement>('[data-vt-card]')].find((el) => el.textContent?.includes(title))!;
    const status = () => document.querySelector('[role="status"]')!.textContent;
    const where = (id: number) => items.value.find((c) => c.id === id)!;
    return { items, columns, card, status, where, onMove, onRefused, onColumnMove, onClick };
}

describe('Taskboard', () => {
    it('shows each column as a list named by its title and count, with one card in the tab order', () => {
        mountFlat();
        const lists = document.querySelectorAll<HTMLElement>('ul');
        expect(lists).toHaveLength(3);
        const name = (list: HTMLElement) =>
            list
                .getAttribute('aria-labelledby')!
                .split(' ')
                .map((id) => document.getElementById(id)!.textContent)
                .join(' ');
        expect(name(lists[0]!)).toBe('To do 2 cards');
        expect(name(lists[1]!)).toBe('Doing 1 of 1 cards');
        expect([...document.querySelectorAll('[data-vt-card]')].map((c) => c.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1']);
        expect(document.querySelectorAll('.vt-taskboard-wip-at').length).toBeGreaterThan(0);
    });

    it('moves focus between cards with the arrows', async () => {
        const { card } = mountFlat();
        card('Write spec').focus();
        await press(card('Write spec'), 'ArrowDown');
        expect(document.activeElement).toBe(card('Fix bug'));
        await press(card('Fix bug'), 'ArrowRight');
        expect(document.activeElement).toBe(card('Review'));
        expect(card('Review').getAttribute('tabindex')).toBe('0');
    });

    it('picks a card up with Space, carries it with the arrows and drops it with Space', async () => {
        const { card, status, where, onMove, items } = mountFlat();
        card('Fix bug').focus();
        await press(card('Fix bug'), ' ');
        expect(status()).toBe('Fix bug picked up, position 2 of 2 in To do');
        await press(card('Fix bug'), 'ArrowUp');
        expect(status()).toBe('Fix bug: position 1 of 2 in To do');
        expect(document.activeElement).toBe(card('Fix bug'));
        await press(card('Fix bug'), 'ArrowRight');
        await press(card('Fix bug'), 'ArrowRight');
        expect(status()).toBe('Fix bug: position 1 of 2 in Done');
        await press(card('Fix bug'), ' ');
        await settle();
        expect(where(2).column).toBe('done');
        expect(items.value.filter((c) => c.column === 'done').map((c) => c.title)).toEqual(['Fix bug', 'Ship']);
        expect(status()).toBe('Fix bug dropped in Done, position 1 of 2');
        expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ from: { column: 'todo', index: 1 }, to: { column: 'done', index: 0 }, via: 'keyboard' }));
        expect(document.activeElement).toBe(card('Fix bug'));
    });

    it('puts the card back on Escape', async () => {
        const { card, status, items } = mountFlat();
        const before = items.value;
        card('Write spec').focus();
        await press(card('Write spec'), ' ');
        await press(card('Write spec'), 'ArrowDown');
        expect(document.querySelectorAll('ul')[0]!.textContent).toMatch(/Fix bug.*Write spec/);
        await press(card('Write spec'), 'Escape');
        await settle();
        expect(items.value).toBe(before);
        expect(status()).toBe('Move cancelled. Write spec is back in To do, position 1 of 2');
        expect(document.querySelectorAll('ul')[0]!.textContent).toMatch(/Write spec.*Fix bug/);
    });

    it('refuses a drop into a column at its limit, and a locked card', async () => {
        const { card, status, where, onRefused } = mountFlat();
        card('Write spec').focus();
        await press(card('Write spec'), ' ');
        await press(card('Write spec'), 'ArrowRight');
        expect(status()).toBe('Doing is at its limit of 1 cards');
        expect(document.querySelector('.vt-taskboard-refused')).not.toBeNull();
        await press(card('Write spec'), ' ');
        expect(onRefused).toHaveBeenCalledWith(expect.objectContaining({ reason: 'wip' }));
        expect(where(1).column).toBe('todo');
        await press(card('Write spec'), 'Escape');
        card('Ship').focus();
        await press(card('Ship'), ' ');
        await settle();
        expect(status()).toBe('Ship is locked and cannot be moved');
        expect(card('Ship').getAttribute('aria-describedby')).toBeNull();
    });

    it('asks canDrop', async () => {
        const { card, where } = mountFlat({ canDrop: ({ to }: { to: { column: string } }) => to.column !== 'done' });
        card('Review').focus();
        await press(card('Review'), ' ');
        await press(card('Review'), 'ArrowRight');
        await press(card('Review'), ' ');
        expect(where(3).column).toBe('doing');
    });

    it('moves between swimlanes and rewrites the lane field', async () => {
        const { card, where, status } = mountFlat({ laneField: 'lane' });
        const lists = document.querySelectorAll('ul');
        expect(lists).toHaveLength(6);
        expect(lists[0]!.getAttribute('aria-label')).toBe('To do, web');
        card('Write spec').focus();
        await press(card('Write spec'), ' ');
        await press(card('Write spec'), 'PageDown');
        expect(status()).toBe('Write spec: position 1 of 2 in To do, api');
        await press(card('Write spec'), 'Enter');
        await settle();
        expect(where(1)).toMatchObject({ column: 'todo', lane: 'api' });
    });

    it('collapses a column with a disclosure button', async () => {
        mountFlat();
        const toggle = document.querySelector<HTMLButtonElement>('button[aria-label="To do cards"]')!;
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        toggle.click();
        await nextTick();
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
        expect(document.querySelectorAll('ul')[0]!.children).toHaveLength(0);
    });

    it('moves a column with its handle from the keyboard', async () => {
        const { columns, onColumnMove, status } = mountFlat();
        const handle = document.querySelector<HTMLButtonElement>('button[aria-label="Move column To do"]')!;
        handle.focus();
        await press(handle, ' ');
        expect(status()).toBe('Column To do picked up, position 1 of 3');
        await press(handle, 'ArrowRight');
        expect(document.activeElement?.getAttribute('aria-label')).toBe('Move column To do');
        await press(document.activeElement!, ' ');
        await settle();
        expect(columns.value.map((c) => c.key)).toEqual(['doing', 'todo', 'done']);
        expect(onColumnMove).toHaveBeenCalledWith(expect.objectContaining({ from: 0, to: 1 }));
    });

    it('drags a card with the pointer on a nested board', async () => {
        const columns = ref<TaskboardColumn[]>([
            { key: 'a', title: 'A', items: [{ id: 1, title: 'One' }, { id: 2, title: 'Two' }] },
            { key: 'b', title: 'B', items: [{ id: 3, title: 'Three' }] }
        ]);
        mountVt(defineComponent(() => () => h(Taskboard, { columns: columns.value, 'onUpdate:columns': (v: TaskboardColumn[]) => (columns.value = v) })));
        const cells = document.querySelectorAll<HTMLElement>('[data-vt-cell]');
        const cards = document.querySelectorAll<HTMLElement>('[data-vt-card]');
        cards[2]!.getBoundingClientRect = () => ({ top: 0, height: 20, left: 0, width: 100 }) as DOMRect;
        document.elementFromPoint = () => cells[1]!;
        const at = (type: string, x: number, y: number) => new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', button: 0 });
        cards[0]!.dispatchEvent(at('pointerdown', 0, 0));
        document.dispatchEvent(at('pointermove', 30, 50));
        await nextTick();
        expect(document.querySelector('.vt-taskboard-preview')).not.toBeNull();
        expect(cells[1]!.classList.contains('vt-taskboard-drop')).toBe(true);
        document.dispatchEvent(at('pointerup', 30, 50));
        await settle();
        expect(columns.value.map((c) => c.items!.map((i) => (i as { title: string }).title))).toEqual([['Two'], ['Three', 'One']]);
        expect(document.querySelector('.vt-taskboard-preview')).toBeNull();
    });

    it('has no accessibility violations, at rest and while carrying a card', async () => {
        const { card } = mountFlat({ laneField: 'lane' });
        await expectNoA11yViolations();
        card('Write spec').focus();
        await press(card('Write spec'), ' ');
        await press(card('Write spec'), 'ArrowRight');
        await expectNoA11yViolations();
    });
});

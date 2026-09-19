import { ptBR } from '@vitral/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import type { TaskboardColumn } from './engine/types';
import { createTaskboard, type TaskboardHandle } from './taskboard';

interface Card {
    id: number;
    title: string;
    column?: string;
    lane?: string;
    locked?: boolean;
}

const cards: Card[] = [
    { id: 1, title: 'Write the spec', column: 'todo' },
    { id: 2, title: 'Read the spec', column: 'todo' },
    { id: 3, title: 'Ship it', column: 'doing' },
    { id: 4, title: 'Celebrate', column: 'done' }
];

const columns = (): TaskboardColumn[] => [
    { key: 'todo', title: 'To do' },
    { key: 'doing', title: 'Doing' },
    { key: 'done', title: 'Done' }
];

let handle: TaskboardHandle | null = null;

function mount(config: Record<string, unknown> = {}) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    handle = createTaskboard(element, { columns: columns(), items: [...cards], ...config });
    const cardsIn = (column: string) =>
        Array.from(element.querySelectorAll<HTMLElement>('[data-vt-cell]'))
            .find((cell) => cell.querySelector('ul')?.id.includes(column))!
            .querySelectorAll('[data-vt-card]');
    return {
        element,
        lists: () => Array.from(element.querySelectorAll<HTMLElement>('[data-vt-list]')),
        allCards: () => Array.from(element.querySelectorAll<HTMLElement>('[data-vt-card]')),
        card: (title: string) => Array.from(element.querySelectorAll<HTMLElement>('[data-vt-card]')).find((el) => el.textContent?.includes(title))!,
        titlesIn: (column: string) => Array.from(cardsIn(column)).map((el) => el.textContent?.trim()),
        status: () => element.querySelector('[role="status"]')?.textContent ?? '',
        counts: () => Array.from(element.querySelectorAll('.vt-taskboard-count')).map((el) => el.textContent)
    };
}

const key = (target: Element, k: string, options: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...options }));

afterEach(() => {
    handle?.destroy();
    handle = null;
    document.body.innerHTML = '';
});

describe('a board with no framework in it', () => {
    it('draws a list a column, named by the column and its count', () => {
        const { lists, titlesIn } = mount();
        expect(lists()).toHaveLength(3);
        expect(titlesIn('todo')).toEqual(['Write the spec', 'Read the spec']);
        expect(titlesIn('done')).toEqual(['Celebrate']);
        const named = lists()[0]!.getAttribute('aria-labelledby')!.split(' ');
        expect(document.getElementById(named[0]!)?.textContent).toBe('To do');
        expect(document.getElementById(named[1]!)?.textContent).toBe('2 cards');
    });

    it('shows a column’s limit, and how full it is', () => {
        const { counts, element } = mount({ columns: [{ key: 'todo', title: 'To do', wipLimit: 2 }, ...columns().slice(1)] });
        expect(counts()[0]).toBe('2/2');
        expect(element.querySelector('.vt-taskboard-count-at')).not.toBeNull();
    });

    it('holds one tab stop, and the arrows move it', () => {
        const { allCards, card } = mount();
        expect(allCards().filter((el) => el.getAttribute('tabindex') === '0')).toHaveLength(1);
        card('Write the spec').focus();
        key(card('Write the spec'), 'ArrowDown');
        expect(document.activeElement).toBe(card('Read the spec'));
        key(card('Read the spec'), 'ArrowRight');
        expect(document.activeElement).toBe(card('Ship it'));
    });

    it('carries a card with the keyboard, and says every step', () => {
        const moved = vi.fn();
        const { card, titlesIn, status } = mount({ on: { 'card-move': moved } });
        const first = card('Write the spec');
        first.focus();
        key(first, ' ');
        expect(status()).toBe('Write the spec picked up, position 1 of 2 in To do');
        key(card('Write the spec'), 'ArrowRight');
        expect(status()).toContain('Doing');
        // What is seen is what a drop will commit.
        expect(titlesIn('doing')).toContain('Write the spec');
        key(card('Write the spec'), ' ');
        expect(moved).toHaveBeenCalledTimes(1);
        const move = moved.mock.calls[0]![0];
        expect(move.from).toEqual({ column: 'todo', index: 0 });
        expect(move.to.column).toBe('doing');
        expect(move.via).toBe('keyboard');
        expect(titlesIn('todo')).toEqual(['Read the spec']);
    });

    it('puts a carried card back on Escape', () => {
        const moved = vi.fn();
        const { card, titlesIn, status } = mount({ on: { 'card-move': moved } });
        card('Celebrate').focus();
        key(card('Celebrate'), ' ');
        key(card('Celebrate'), 'ArrowLeft');
        expect(titlesIn('doing')).toContain('Celebrate');
        key(card('Celebrate'), 'Escape');
        expect(status()).toContain('Move cancelled');
        expect(titlesIn('done')).toEqual(['Celebrate']);
        expect(moved).not.toHaveBeenCalled();
    });

    it('refuses a drop a full column cannot take, and says why', () => {
        const refused = vi.fn();
        const { card, titlesIn, status } = mount({
            columns: [columns()[0]!, { key: 'doing', title: 'Doing', wipLimit: 1 }, columns()[2]!],
            on: { 'drop-refused': refused }
        });
        card('Write the spec').focus();
        key(card('Write the spec'), ' ');
        key(card('Write the spec'), 'ArrowRight');
        expect(status()).toBe('Doing is at its limit of 1 cards');
        // Refused, so it is still shown where it was.
        expect(titlesIn('todo')).toContain('Write the spec');
        key(card('Write the spec'), ' ');
        expect(refused).toHaveBeenCalledWith(expect.objectContaining({ reason: 'wip' }));
        expect(titlesIn('todo')).toContain('Write the spec');
    });

    it('asks the application before a drop, and takes no for an answer', () => {
        const refused = vi.fn();
        const { card, titlesIn } = mount({ canDrop: ({ to }: { to: { column: string } }) => to.column !== 'done', on: { 'drop-refused': refused } });
        card('Ship it').focus();
        key(card('Ship it'), ' ');
        key(card('Ship it'), 'ArrowRight');
        key(card('Ship it'), ' ');
        expect(refused).toHaveBeenCalledWith(expect.objectContaining({ reason: 'canDrop' }));
        expect(titlesIn('doing')).toEqual(['Ship it']);
    });

    it('leaves a locked card where it is', () => {
        const { card, status } = mount({ items: [{ id: 1, title: 'Frozen', column: 'todo', locked: true }] });
        card('Frozen').focus();
        key(card('Frozen'), ' ');
        expect(status()).toContain('cannot be moved');
    });

    it('collapses a column, and says so', () => {
        const changed = vi.fn();
        const { element, allCards } = mount({ on: { change: changed } });
        const toggle = element.querySelector<HTMLButtonElement>('.vt-taskboard-toggle')!;
        expect(toggle.getAttribute('aria-expanded')).toBe('true');
        toggle.click();
        expect(handle!.state().collapsedColumns).toEqual(['todo']);
        expect(element.querySelector('.vt-taskboard-toggle')!.getAttribute('aria-expanded')).toBe('false');
        // Its cards are not drawn while it is shut.
        expect(allCards().map((el) => el.textContent)).not.toContain('Write the spec');
        expect(changed).toHaveBeenCalled();
    });

    it('moves a column by its handle and the keyboard', () => {
        const moved = vi.fn();
        const { element } = mount({ on: { 'column-move': moved } });
        const titles = () => Array.from(element.querySelectorAll('.vt-taskboard-title')).map((el) => el.textContent);
        const handleEl = element.querySelector<HTMLButtonElement>('.vt-taskboard-handle')!;
        expect(handleEl.getAttribute('aria-label')).toBe('Move column To do');
        handleEl.focus();
        key(handleEl, ' ');
        key(element.querySelector('.vt-taskboard-handle')!, 'ArrowRight');
        expect(titles()).toEqual(['Doing', 'To do', 'Done']);
        key(element.querySelectorAll('.vt-taskboard-handle')[1]!, ' ');
        expect(moved).toHaveBeenCalledWith(expect.objectContaining({ from: 0, to: 1 }));
        expect(titles()).toEqual(['Doing', 'To do', 'Done']);
    });

    it('reports a press on a card', () => {
        const clicked = vi.fn();
        const { card } = mount({ on: { 'card-click': clicked } });
        card('Ship it').click();
        expect(clicked).toHaveBeenCalledTimes(1);
        expect(clicked.mock.calls[0]![0].column.key).toBe('doing');
    });

    it('speaks the locale it is given', () => {
        const { element } = mount({ locale: ptBR, items: [] });
        expect(element.querySelector('.vt-taskboard-empty')?.textContent).toBe('Nenhum cartão');
    });

    it('clears up after itself', () => {
        const { element } = mount();
        handle!.destroy();
        handle = null;
        expect(element.children).toHaveLength(0);
        expect(element.className).toBe('');
    });
});

describe('a board given as columns that carry their cards', () => {
    const nested = (): TaskboardColumn[] => [
        { key: 'todo', title: 'To do', items: [{ id: 1, title: 'One' }] },
        { key: 'done', title: 'Done', items: [{ id: 2, title: 'Two' }] }
    ];

    it('puts the cards back where it found them', () => {
        const updated = vi.fn();
        const { card, titlesIn } = mount({ columns: nested(), items: undefined, on: { 'update:columns': updated } });
        card('One').focus();
        key(card('One'), ' ');
        key(card('One'), 'ArrowRight');
        key(card('One'), ' ');
        // It keeps the place it held, which is where the arrow carried it to.
        expect(titlesIn('done')).toEqual(['One', 'Two']);
        const columnsAfter = updated.mock.calls[0]![0] as TaskboardColumn[];
        expect(columnsAfter.map((column) => (column.items ?? []).map((item) => (item as Card).title))).toEqual([[], ['One', 'Two']]);
    });
});

describe('a board with swimlanes', () => {
    const laned = [
        { id: 1, title: 'Urgent one', column: 'todo', lane: 'high' },
        { id: 2, title: 'Later one', column: 'todo', lane: 'low' },
        { id: 3, title: 'Unsorted', column: 'todo' }
    ];

    it('makes a row of each lane, and one more for what names none', () => {
        const { element } = mount({ items: laned, laneField: 'lane' });
        const lanes = Array.from(element.querySelectorAll('.vt-taskboard-lane-title')).map((el) => el.textContent);
        expect(lanes).toEqual(['high', 'low', 'Other']);
        const cell = element.querySelector<HTMLElement>('[data-vt-cell][data-lane="0"] ul')!;
        expect(cell.getAttribute('aria-label')).toBe('To do, high');
    });

    it('carries a card across lanes with Page Down, and relabels it', () => {
        const moved = vi.fn();
        const { card } = mount({ items: laned, laneField: 'lane', on: { 'card-move': moved } });
        card('Urgent one').focus();
        key(card('Urgent one'), ' ');
        key(card('Urgent one'), 'PageDown');
        key(card('Urgent one'), ' ');
        expect(moved).toHaveBeenCalledTimes(1);
        const move = moved.mock.calls[0]![0];
        expect(move.to.lane).toBe('low');
        expect((move.value as Card[]).find((item) => item.title === 'Urgent one')!.lane).toBe('low');
    });

    it('collapses a lane', () => {
        const { element } = mount({ items: laned, laneField: 'lane' });
        const toggle = element.querySelectorAll<HTMLButtonElement>('.vt-taskboard-lane .vt-taskboard-toggle')[0]!;
        toggle.click();
        expect(handle!.state().collapsedLanes).toEqual(['high']);
        expect(element.querySelector('[data-vt-cell][data-lane="0"]')).toBeNull();
    });
});

describe('what it says to a reader who cannot see it', () => {
    it('has nothing axe objects to', async () => {
        const { element } = mount({ columns: [{ key: 'todo', title: 'To do', wipLimit: 3, color: 'tomato' }, ...columns().slice(1)] });
        await expectNoA11yViolations(element);
    });

    it('has nothing axe objects to with lanes, one collapsed', async () => {
        const { element } = mount({ items: [{ id: 1, title: 'One', column: 'todo', lane: 'high' }], laneField: 'lane', collapsedColumns: ['done'] });
        await expectNoA11yViolations(element);
    });

    it('tells a reader what the keyboard does, where the cards point at it', () => {
        const { card, element } = mount();
        const help = card('Ship it').getAttribute('aria-describedby')!;
        expect(element.querySelector(`#${help}`)?.textContent).toContain('Space');
        const handleEl = element.querySelector<HTMLButtonElement>('.vt-taskboard-handle')!;
        expect(element.querySelector(`#${handleEl.getAttribute('aria-describedby')}`)?.textContent).toContain('Space');
    });
});

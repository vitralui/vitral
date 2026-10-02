import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import { useToast } from '../../composables/useToast';
import Toast from './Toast.vue';

function mountToast(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
    let api!: ReturnType<typeof useToast>;
    const wrapper = mountVt(
        defineComponent(() => {
            api = useToast();
            return () => h(Toast, props, slots);
        })
    );
    const cards = () => Array.from(document.querySelectorAll<HTMLElement>('.vt-toast-message'));
    return { wrapper, toast: () => api, cards };
}

describe('Toast', () => {
    afterEach(() => vi.useRealTimers());

    it('shows a message in a polite status region, with the close button outside it', async () => {
        const { toast, cards } = mountToast();
        toast().add({ severity: 'success', summary: 'Saved', detail: 'The file is on disk.' });
        await nextTick();
        const region = cards()[0]!.querySelector('[role="status"]')!;
        expect(region.getAttribute('aria-live')).toBe('polite');
        expect(region.getAttribute('aria-atomic')).toBe('true');
        expect(region.textContent).toContain('Saved');
        expect(region.textContent).toContain('The file is on disk.');
        const close = cards()[0]!.querySelector('button')!;
        expect(close.getAttribute('aria-label')).toBe('Close');
        expect(region.contains(close)).toBe(false);
        expect(cards()[0]!.classList).toContain('vt-toast-message-success');
    });

    it('interrupts with an assertive alert for danger', async () => {
        const { toast, cards } = mountToast();
        toast().add({ severity: 'danger', summary: 'Upload failed' });
        await nextTick();
        const region = cards()[0]!.querySelector('[role="alert"]')!;
        expect(region.getAttribute('aria-live')).toBe('assertive');
    });

    it('closes from its button and emits close', async () => {
        const { wrapper, toast, cards } = mountToast();
        toast().add({ summary: 'One' });
        await nextTick();
        cards()[0]!.querySelector('button')!.click();
        await nextTick();
        expect(cards()).toHaveLength(0);
        expect(wrapper.findComponent(Toast).emitted('close')?.[0]?.[0]).toMatchObject({ message: { summary: 'One' } });
    });

    it('closes by itself after its life, which pauses on hover and focus', async () => {
        vi.useFakeTimers();
        const { wrapper, toast, cards } = mountToast();
        toast().add({ summary: 'Brief', life: 3000 });
        await nextTick();
        const card = cards()[0]!;
        vi.advanceTimersByTime(2000);
        card.dispatchEvent(new MouseEvent('mouseenter'));
        card.querySelector('button')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        vi.advanceTimersByTime(10000);
        await nextTick();
        expect(cards()).toHaveLength(1);
        card.dispatchEvent(new MouseEvent('mouseleave'));
        card.querySelector('button')!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        vi.advanceTimersByTime(999);
        await nextTick();
        expect(cards()).toHaveLength(1);
        vi.advanceTimersByTime(1);
        await nextTick();
        expect(cards()).toHaveLength(0);
        expect(wrapper.findComponent(Toast).emitted('life-end')).toHaveLength(1);
    });

    it('removes by message or id, by group and all at once', async () => {
        const { toast, cards } = mountToast();
        const first = { summary: 'First' };
        toast().add(first);
        const id = toast().add({ summary: 'Second' });
        toast().add({ summary: 'Third' });
        await nextTick();
        toast().remove(first);
        toast().remove(id);
        await nextTick();
        expect(cards().map((c) => c.textContent?.trim())).toEqual(['Third']);
        toast().removeAll();
        await nextTick();
        expect(cards()).toHaveLength(0);
    });

    it('shows only its own group', async () => {
        const { toast, cards } = mountToast({ group: 'uploads' });
        toast().add({ summary: 'Elsewhere' });
        toast().add({ summary: 'Mine', group: 'uploads' });
        await nextTick();
        expect(cards().map((c) => c.textContent?.trim())).toEqual(['Mine']);
        toast().removeGroup('uploads');
        await nextTick();
        expect(cards()).toHaveLength(0);
    });

    it('updates a message sent again with the same id', async () => {
        const { toast, cards } = mountToast();
        toast().add({ id: 'job', summary: 'Uploading' });
        toast().add({ id: 'job', summary: 'Uploaded', severity: 'success' });
        await nextTick();
        expect(cards()).toHaveLength(1);
        expect(cards()[0]!.textContent).toContain('Uploaded');
    });

    it('sits in the corner it is given, stacked on the toast layer', async () => {
        const { toast } = mountToast({ position: 'bottom-center' });
        toast().add({ summary: 'Hi' });
        await nextTick();
        const root = document.querySelector<HTMLElement>('.vt-toast')!;
        expect(root.classList).toContain('vt-toast-bottom-center');
        expect(Number(root.style.zIndex)).toBeGreaterThanOrEqual(1200);
    });

    it('renders a custom message slot inside the live region', async () => {
        const { toast, cards } = mountToast({}, { message: ({ message }: { message: { summary: string } }) => h('strong', message.summary.toUpperCase()) });
        toast().add({ summary: 'custom' });
        await nextTick();
        expect(cards()[0]!.querySelector('[role="status"] strong')?.textContent).toBe('CUSTOM');
    });

    it('has no accessibility violations', async () => {
        const { toast } = mountToast();
        toast().add({ severity: 'info', summary: 'Info', detail: 'Something happened.' });
        toast().add({ severity: 'danger', summary: 'Error', closable: false });
        await nextTick();
        await expectNoA11yViolations();
    });

    describe('more than one at a time', () => {
        it('takes several messages at once and returns their ids', async () => {
            const { toast, cards } = mountToast();
            const ids = toast().add([{ summary: 'One' }, { summary: 'Two' }, { summary: 'Three' }]);
            await nextTick();
            expect(ids).toHaveLength(3);
            expect(cards().map((c) => c.textContent)).toEqual([expect.stringContaining('One'), expect.stringContaining('Two'), expect.stringContaining('Three')]);
        });

        it('makes the newer ones wait past max, and shows the next when one leaves', async () => {
            vi.useFakeTimers();
            const { toast, cards } = mountToast({ max: 2 });
            toast().add([{ summary: 'A', life: 1000 }, { summary: 'B' }, { summary: 'C', life: 1000 }]);
            await nextTick();
            expect(cards().map((c) => c.textContent?.trim())).toEqual([expect.stringContaining('A'), expect.stringContaining('B')]);
            // C's life has not started while it waits.
            vi.advanceTimersByTime(1000);
            await nextTick();
            expect(cards().map((c) => c.textContent)).toEqual([expect.stringContaining('B'), expect.stringContaining('C')]);
            vi.advanceTimersByTime(999);
            await nextTick();
            expect(cards()).toHaveLength(2);
        });

        it('closes the oldest to make room when it replaces, pinned ones kept', async () => {
            const { toast, cards } = mountToast({ max: 2, overflow: 'replace' });
            toast().add([{ summary: 'Pinned', pinned: true }, { summary: 'Old' }, { summary: 'New' }]);
            await nextTick();
            expect(cards().map((c) => c.textContent)).toEqual([expect.stringContaining('Pinned'), expect.stringContaining('New')]);
        });

        it('puts the newest first when asked, pinned ones always at the head', async () => {
            const { toast, cards } = mountToast({ newestOnTop: true });
            toast().add([{ summary: 'First' }, { summary: 'Pin', pinned: true }, { summary: 'Last' }]);
            await nextTick();
            expect(cards().map((c) => c.textContent)).toEqual([expect.stringContaining('Pin'), expect.stringContaining('Last'), expect.stringContaining('First')]);
            expect(cards()[0]!.classList).toContain('vt-toast-message-pinned');
        });
    });

    describe('grouping and keeping', () => {
        it('collapses messages with the same key into one card that counts', async () => {
            vi.useFakeTimers();
            const { toast, cards } = mountToast();
            toast().add({ summary: 'Uploaded a.png', collapseKey: 'upload', life: 1000 });
            vi.advanceTimersByTime(800);
            toast().add({ summary: 'Uploaded b.png', collapseKey: 'upload', life: 1000 });
            await nextTick();
            expect(cards()).toHaveLength(1);
            expect(cards()[0]!.textContent).toContain('Uploaded b.png');
            expect(cards()[0]!.querySelector('.vt-toast-count')!.textContent).toContain('2 times');
            // The life started again with the second message.
            vi.advanceTimersByTime(800);
            await nextTick();
            expect(cards()).toHaveLength(1);
        });

        it('never times out a pinned toast', async () => {
            vi.useFakeTimers();
            const { toast, cards } = mountToast();
            toast().add({ summary: 'Read me', pinned: true, life: 500 });
            vi.advanceTimersByTime(5000);
            await nextTick();
            expect(cards()).toHaveLength(1);
        });
    });

    describe('actions, updates and promises', () => {
        it('runs an action and closes, unless it keeps the toast open', async () => {
            const undo = vi.fn();
            const { toast, cards, wrapper } = mountToast();
            toast().add({ summary: 'Deleted', actions: [{ label: 'Undo', onClick: undo }, { label: 'Details', keepOpen: true }] });
            await nextTick();
            const [undoButton, details] = Array.from(cards()[0]!.querySelectorAll<HTMLButtonElement>('.vt-toast-actions button'));
            details!.click();
            await nextTick();
            expect(cards()).toHaveLength(1);
            undoButton!.click();
            await nextTick();
            expect(undo).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Deleted' }));
            expect(cards()).toHaveLength(0);
            expect(wrapper.findComponent(Toast).emitted('action')).toHaveLength(2);
        });

        it('updates a card in place', async () => {
            const { toast, cards } = mountToast();
            const id = toast().add({ summary: 'Saving' });
            await nextTick();
            toast().update(id, { summary: 'Saved', severity: 'success' });
            await nextTick();
            expect(cards()).toHaveLength(1);
            expect(cards()[0]!.textContent).toContain('Saved');
            expect(cards()[0]!.classList).toContain('vt-toast-message-success');
        });

        it('follows a promise from loading to its outcome', async () => {
            const { toast, cards } = mountToast();
            let resolve!: (value: number) => void;
            const work = new Promise<number>((r) => (resolve = r));
            toast().promise(work, { loading: { summary: 'Uploading' }, success: (n) => ({ summary: `${n} files uploaded` }) });
            await nextTick();
            expect(cards()[0]!.textContent).toContain('Uploading');
            expect(cards()[0]!.querySelector('button[aria-label="Close"]')).toBeNull();
            resolve(3);
            await work;
            await nextTick();
            expect(cards()[0]!.textContent).toContain('3 files uploaded');
            expect(cards()[0]!.classList).toContain('vt-toast-message-success');
        });

        it('calls onClose however the toast goes', async () => {
            const onClose = vi.fn();
            const { toast } = mountToast();
            toast().add({ summary: 'Bye', onClose });
            await nextTick();
            toast().removeAll();
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('the stack', () => {
        it('draws a progress bar for a timed card when asked', async () => {
            const { toast, cards } = mountToast({ showProgress: true });
            toast().add([{ summary: 'Timed', life: 3000 }, { summary: 'Sticky' }]);
            await nextTick();
            expect((cards()[0]!.querySelector('.vt-toast-progress') as HTMLElement).style.animationDuration).toBe('3000ms');
            expect(cards()[1]!.querySelector('.vt-toast-progress')).toBeNull();
        });

        it('piles the cards, newest in front, the ones behind out of reach until it spreads', async () => {
            const { toast, cards } = mountToast({ stacked: true });
            toast().add([{ summary: 'Old' }, { summary: 'New' }]);
            await nextTick();
            const root = cards()[0]!.closest('.vt-toast')!;
            expect(root.classList).toContain('vt-toast-stacked');
            expect(cards()[0]!.textContent).toContain('New');
            expect(cards()[1]!.hasAttribute('inert')).toBe(true);
            root.dispatchEvent(new MouseEvent('mouseenter'));
            await nextTick();
            expect(root.classList).toContain('vt-toast-expanded');
            expect(cards()[1]!.hasAttribute('inert')).toBe(false);
        });

        it('holds the countdowns while the page is hidden', async () => {
            vi.useFakeTimers();
            const { toast, cards } = mountToast();
            toast().add({ summary: 'Wait', life: 1000 });
            await nextTick();
            Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
            document.dispatchEvent(new Event('visibilitychange'));
            vi.advanceTimersByTime(5000);
            await nextTick();
            expect(cards()).toHaveLength(1);
            Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
            document.dispatchEvent(new Event('visibilitychange'));
            vi.advanceTimersByTime(1000);
            await nextTick();
            expect(cards()).toHaveLength(0);
        });

        it('closes a card swiped sideways by a finger, not by a mouse', async () => {
            const { toast, cards } = mountToast();
            toast().add([{ summary: 'Swiped' }, { summary: 'Dragged' }]);
            await nextTick();
            const drag = (card: HTMLElement, pointerType: string) => {
                card.dispatchEvent(Object.assign(new Event('pointerdown', { bubbles: true }), { pointerId: 1, pointerType, clientX: 0 }));
                card.dispatchEvent(Object.assign(new Event('pointermove', { bubbles: true }), { pointerId: 1, pointerType, clientX: 120 }));
                card.dispatchEvent(Object.assign(new Event('pointerup', { bubbles: true }), { pointerId: 1, pointerType, clientX: 120 }));
            };
            drag(cards()[1]!, 'mouse');
            drag(cards()[0]!, 'touch');
            await nextTick();
            expect(cards().map((c) => c.textContent)).toEqual([expect.stringContaining('Dragged')]);
        });
    });
});
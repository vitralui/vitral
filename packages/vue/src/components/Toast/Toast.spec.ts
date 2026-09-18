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
});

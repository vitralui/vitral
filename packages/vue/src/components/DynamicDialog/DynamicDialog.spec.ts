import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import { useDialog, useDialogRef } from '../../composables/useDialog';
import type { DynamicDialogInstance } from '../../config/services';
import DynamicDialog from './DynamicDialog.vue';

const Picker = defineComponent({
    emits: ['pick'],
    setup(_, { emit }) {
        const dialog = useDialogRef()!;
        const data = dialog.data as { items: string[] };
        return () =>
            h('div', [
                h('p', `Pick one of ${data.items.length}`),
                ...data.items.map((item) => h('button', { onClick: () => (emit('pick', item), dialog.close(item)) }, item))
            ]);
    }
});

const Footer = defineComponent({
    setup() {
        const dialog = useDialogRef()!;
        return () => h('button', { onClick: () => dialog.close('none') }, 'Cancel');
    }
});

function mountHost() {
    let api!: ReturnType<typeof useDialog>;
    mountVt(
        defineComponent(() => {
            api = useDialog();
            return () => [h('button', { id: 'open' }, 'Open'), h(DynamicDialog)];
        })
    );
    const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
    const button = (label: string) => Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === label)!;
    async function open(options: Parameters<ReturnType<typeof useDialog>['open']>[1] = {}): Promise<DynamicDialogInstance> {
        document.getElementById('open')!.focus();
        const instance = api.open(Picker, { props: { header: 'Choose a fruit' }, data: { items: ['Apple', 'Pear'] }, ...options });
        await nextTick();
        await nextTick();
        return instance;
    }
    return { dialog, button, open };
}

describe('DynamicDialog', () => {
    it('opens a modal dialog around the given component, which reads its data', async () => {
        const { dialog, open, button } = mountHost();
        await open();
        expect(dialog()!.getAttribute('aria-modal')).toBe('true');
        expect(document.getElementById(dialog()!.getAttribute('aria-labelledby')!)?.textContent?.trim()).toBe('Choose a fruit');
        expect(dialog()!.textContent).toContain('Pick one of 2');
        expect(document.activeElement).toBe(button('Apple'));
    });

    it('closes from the content with data, forwards its events and gives focus back', async () => {
        const onClose = vi.fn();
        const pick = vi.fn();
        const { dialog, open, button } = mountHost();
        await open({ onClose, emits: { pick } });
        button('Pear').click();
        await nextTick();
        await nextTick();
        expect(pick).toHaveBeenCalledWith('Pear');
        expect(onClose).toHaveBeenCalledWith({ type: 'config-close', data: 'Pear' });
        expect(dialog()).toBeNull();
        expect(document.activeElement?.id).toBe('open');
    });

    it('reports a close by the reader, and closes from the returned instance', async () => {
        const onClose = vi.fn();
        const { dialog, open } = mountHost();
        await open({ onClose });
        await press(dialog()!, 'Escape');
        await nextTick();
        expect(onClose).toHaveBeenLastCalledWith({ type: 'dialog-close' });
        const instance = await open({ onClose });
        instance.close(42);
        await nextTick();
        expect(onClose).toHaveBeenLastCalledWith({ type: 'config-close', data: 42 });
        expect(dialog()).toBeNull();
    });

    it('renders footer components with the same dialog ref, and stacks dialogs', async () => {
        const onClose = vi.fn();
        const { open, button } = mountHost();
        await open({ onClose, templates: { footer: Footer } });
        button('Cancel').click();
        await nextTick();
        expect(onClose).toHaveBeenCalledWith({ type: 'config-close', data: 'none' });
        await open();
        await open({ props: { header: 'Second' } });
        expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(2);
    });

    it('has no accessibility violations when open', async () => {
        const { open } = mountHost();
        await expectNoA11yViolations();
        await open();
        await expectNoA11yViolations();
    });
});

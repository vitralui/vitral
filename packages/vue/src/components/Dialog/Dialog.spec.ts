import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Dialog from './Dialog.vue';

function mountDialog(props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) {
    const visible = ref(false);
    const wrapper = mountVt(
        defineComponent(() => () => [
            h('button', { id: 'opener', onClick: () => (visible.value = true) }, 'Edit'),
            h(
                Dialog,
                { header: 'Edit profile', ...props, visible: visible.value, 'onUpdate:visible': (v: boolean) => (visible.value = v) },
                {
                    default: () => [h('label', { for: 'name' }, 'Name'), h('input', { id: 'name' })],
                    footer: () => h('button', { id: 'save' }, 'Save'),
                    ...slots
                }
            )
        ])
    );
    const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
    const opener = () => document.getElementById('opener')!;
    async function open() {
        opener().focus();
        visible.value = true;
        await nextTick();
        await nextTick();
    }
    return { wrapper, visible, dialog, opener, open };
}

describe('Dialog', () => {
    it('renders nothing while closed', async () => {
        const { dialog } = mountDialog();
        expect(dialog()).toBeNull();
        await expectNoA11yViolations();
    });

    it('opens as a modal dialog named by its header, focus on the first field', async () => {
        const { dialog, open } = mountDialog();
        await open();
        const el = dialog()!;
        expect(el.getAttribute('aria-modal')).toBe('true');
        expect(document.getElementById(el.getAttribute('aria-labelledby')!)?.textContent?.trim()).toBe('Edit profile');
        expect(document.activeElement).toBe(document.getElementById('name'));
        expect(el.parentElement?.classList).toContain('vt-mask');
        expect(el.parentElement?.style.zIndex).not.toBe('');
    });

    it('focuses an autofocus element before anything else', async () => {
        const { open } = mountDialog({}, { footer: () => h('button', { id: 'save', autofocus: true }, 'Save') });
        await open();
        expect(document.activeElement).toBe(document.getElementById('save'));
    });

    it('keeps Tab inside, wrapping at both ends', async () => {
        const { dialog, open } = mountDialog();
        await open();
        const close = dialog()!.querySelector<HTMLButtonElement>('button[aria-label="Close"]')!;
        const save = document.getElementById('save')!;
        save.focus();
        await press(save, 'Tab');
        expect(document.activeElement).toBe(close);
        await press(close, 'Tab', { shiftKey: true });
        expect(document.activeElement).toBe(save);
    });

    it('closes on Escape and gives focus back to the opener', async () => {
        const { wrapper, dialog, open, opener } = mountDialog();
        await open();
        await press(document.activeElement!, 'Escape');
        expect(dialog()).toBeNull();
        expect(document.activeElement).toBe(opener());
        const events = wrapper.findComponent(Dialog).emitted();
        expect(events['update:visible']?.[0]).toEqual([false]);
        expect(events.show).toHaveLength(1);
        expect(events.hide).toHaveLength(1);
    });

    it('ignores Escape when closeOnEscape is off', async () => {
        const { dialog, open } = mountDialog({ closeOnEscape: false });
        await open();
        await press(document.activeElement!, 'Escape');
        expect(dialog()).not.toBeNull();
    });

    it('closes from its named close button', async () => {
        const { dialog, open } = mountDialog();
        await open();
        dialog()!.querySelector<HTMLButtonElement>('button[aria-label="Close"]')!.click();
        await nextTick();
        expect(dialog()).toBeNull();
    });

    it('closes on a press on the mask only when dismissableMask is set, and never on the panel', async () => {
        const plain = mountDialog();
        await plain.open();
        const mask = plain.dialog()!.parentElement!;
        mask.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        mask.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await nextTick();
        expect(plain.dialog()).not.toBeNull();
        plain.wrapper.unmount();

        const { dialog, open } = mountDialog({ dismissableMask: true });
        await open();
        const panel = dialog()!;
        panel.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        panel.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await nextTick();
        expect(dialog()).not.toBeNull();
        panel.parentElement!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        panel.parentElement!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await nextTick();
        expect(dialog()).toBeNull();
    });

    it('locks the page scroll while modal, and not when modeless', async () => {
        const modal = mountDialog();
        await modal.open();
        expect(document.body.style.overflow).toBe('hidden');
        modal.visible.value = false;
        await nextTick();
        await nextTick();
        expect(document.body.style.overflow).toBe('');
        modal.wrapper.unmount();

        const modeless = mountDialog({ modal: false });
        await modeless.open();
        expect(modeless.dialog()!.hasAttribute('aria-modal')).toBe(false);
        expect(document.body.style.overflow).toBe('');
        expect(modeless.dialog()!.parentElement!.classList).toContain('vt-dialog-mask-modeless');
    });

    it('maximizes and restores through a button whose name follows its state', async () => {
        const { wrapper, dialog, open } = mountDialog({ maximizable: true });
        await open();
        const button = dialog()!.querySelector<HTMLButtonElement>('button[aria-label="Maximize"]')!;
        button.click();
        await nextTick();
        expect(dialog()!.classList).toContain('vt-dialog-maximized');
        expect(button.getAttribute('aria-label')).toBe('Restore');
        expect(wrapper.findComponent(Dialog).emitted('maximize')).toHaveLength(1);
    });

    it('takes its name from aria-label when it has no header, and places itself', async () => {
        const { dialog, open } = mountDialog({ header: undefined, 'aria-label': 'Settings', position: 'top-right', style: 'width: 30rem' });
        await open();
        expect(dialog()!.getAttribute('aria-label')).toBe('Settings');
        expect(dialog()!.hasAttribute('aria-labelledby')).toBe(false);
        expect(dialog()!.style.width).toBe('30rem');
        expect(dialog()!.parentElement!.classList).toContain('vt-dialog-mask-top-right');
    });

    it('has no accessibility violations while open', async () => {
        const { open } = mountDialog({ maximizable: true });
        await open();
        await expectNoA11yViolations();
    });
});

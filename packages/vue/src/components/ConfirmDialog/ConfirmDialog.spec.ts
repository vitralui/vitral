import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import { useConfirm } from '../../composables/useConfirm';
import type { ConfirmOptions } from '../../config/services';
import ConfirmDialog from './ConfirmDialog.vue';

function mountConfirm(props: Record<string, unknown> = {}) {
    let api!: ReturnType<typeof useConfirm>;
    const wrapper = mountVt(
        defineComponent(() => {
            api = useConfirm();
            return () => [h('button', { id: 'delete' }, 'Delete'), h(ConfirmDialog, props)];
        })
    );
    const dialog = () => document.querySelector<HTMLElement>('[role="alertdialog"]');
    const button = (label: string) => Array.from(dialog()?.querySelectorAll('button') ?? []).find((b) => b.textContent?.trim() === label);
    async function require(options: ConfirmOptions) {
        document.getElementById('delete')!.focus();
        api.require(options);
        await nextTick();
        await nextTick();
    }
    return { wrapper, confirm: () => api, dialog, button, require };
}

describe('ConfirmDialog', () => {
    it('opens as an alertdialog named by its header and described by its message, focus on accept', async () => {
        const { dialog, button, require } = mountConfirm();
        await require({ header: 'Delete file', message: 'This cannot be undone.' });
        const el = dialog()!;
        expect(el.getAttribute('aria-modal')).toBe('true');
        expect(document.getElementById(el.getAttribute('aria-labelledby')!)?.textContent?.trim()).toBe('Delete file');
        expect(document.getElementById(el.getAttribute('aria-describedby')!)?.textContent?.trim()).toBe('This cannot be undone.');
        expect(document.activeElement).toBe(button('Yes'));
    });

    it('moves by its header unless told not to', async () => {
        const header = (dialog: () => HTMLElement | null) => dialog()!.querySelector('.vt-dialog-header')!.classList;
        const moving = mountConfirm();
        await moving.require({ header: 'Delete file', message: 'Sure?' });
        expect(header(moving.dialog)).toContain('vt-dialog-header-draggable');
        moving.wrapper.unmount();
        const fixed = mountConfirm({ draggable: false });
        await fixed.require({ header: 'Delete file', message: 'Sure?' });
        expect(header(fixed.dialog)).not.toContain('vt-dialog-header-draggable');
    });

    it('accepts, closes and returns focus', async () => {
        const accept = vi.fn();
        const reject = vi.fn();
        const { dialog, button, require } = mountConfirm();
        await require({ message: 'Sure?', accept, reject });
        button('Yes')!.click();
        await nextTick();
        await nextTick();
        expect(accept).toHaveBeenCalledTimes(1);
        expect(reject).not.toHaveBeenCalled();
        expect(dialog()).toBeNull();
        expect(document.activeElement?.id).toBe('delete');
    });

    it('focuses reject when asked, with its own labels', async () => {
        const reject = vi.fn();
        const { button, require } = mountConfirm();
        await require({ message: 'Discard changes?', defaultFocus: 'reject', acceptLabel: 'Discard', rejectLabel: 'Keep editing', reject });
        expect(document.activeElement).toBe(button('Keep editing'));
        button('Keep editing')!.click();
        expect(reject).toHaveBeenCalledTimes(1);
    });

    it('keeps Tab between its buttons', async () => {
        const { dialog, require } = mountConfirm();
        await require({ header: 'Leave', message: 'Leave the page?' });
        const buttons = Array.from(dialog()!.querySelectorAll<HTMLButtonElement>('button'));
        const last = buttons[buttons.length - 1]!;
        last.focus();
        await press(last, 'Tab');
        expect(document.activeElement).toBe(buttons[0]);
    });

    it('closes on Escape without answering, calling onHide', async () => {
        const accept = vi.fn();
        const reject = vi.fn();
        const onHide = vi.fn();
        const { dialog, require } = mountConfirm();
        await require({ message: 'Sure?', accept, reject, onHide });
        await press(document.activeElement!, 'Escape');
        expect(dialog()).toBeNull();
        expect(onHide).toHaveBeenCalledTimes(1);
        expect(accept).not.toHaveBeenCalled();
        expect(reject).not.toHaveBeenCalled();
    });

    it('is named from the locale when there is no header', async () => {
        const { dialog, require } = mountConfirm();
        await require({ message: 'Proceed?' });
        expect(dialog()!.getAttribute('aria-label')).toBe('Confirmation');
    });

    it('colours the icon and the accept button by severity', async () => {
        const { dialog, button, require } = mountConfirm();
        await require({ header: 'Delete', message: 'Delete it?', severity: 'danger' });
        expect(button('Yes')!.classList).toContain('vt-button-danger');
        expect(dialog()!.querySelector('.vt-confirmdialog-icon')!.classList).toContain('vt-confirmdialog-icon-danger');
    });

    it('answers only its group, and closes through close()', async () => {
        const { dialog, confirm, require } = mountConfirm({ group: 'files' });
        await require({ message: 'Not mine' });
        expect(dialog()).toBeNull();
        await require({ message: 'Mine', group: 'files' });
        expect(dialog()).not.toBeNull();
        confirm().close();
        await nextTick();
        expect(dialog()).toBeNull();
    });

    it('has no accessibility violations while open', async () => {
        const { require } = mountConfirm();
        await expectNoA11yViolations();
        await require({ header: 'Delete file', message: 'This cannot be undone.', severity: 'danger' });
        await expectNoA11yViolations();
    });
});

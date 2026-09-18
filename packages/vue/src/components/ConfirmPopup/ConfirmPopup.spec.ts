import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import { useConfirm } from '../../composables/useConfirm';
import type { ConfirmOptions } from '../../config/services';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog.vue';
import ConfirmPopup from './ConfirmPopup.vue';

function mountPopup() {
    let api!: ReturnType<typeof useConfirm>;
    mountVt(
        defineComponent(() => {
            api = useConfirm();
            return () => [h('button', { id: 'remove' }, 'Remove'), h(ConfirmPopup), h(ConfirmDialog)];
        })
    );
    const target = () => document.getElementById('remove')!;
    const popup = () => document.querySelector<HTMLElement>('[role="alertdialog"]');
    const button = (label: string) => Array.from(popup()?.querySelectorAll('button') ?? []).find((b) => b.textContent?.trim() === label);
    async function require(options: Partial<ConfirmOptions> = {}) {
        target().focus();
        api.require({ target: target(), message: 'Remove this item?', ...options });
        await nextTick();
        await nextTick();
        await nextTick();
    }
    return { api: () => api, target, popup, button, require };
}

describe('ConfirmPopup', () => {
    it('answers a request with a target, and only it rather than the dialog, as a described alertdialog', async () => {
        const { popup, button, require } = mountPopup();
        await require();
        expect(document.querySelectorAll('[role="alertdialog"]')).toHaveLength(1);
        expect(popup()!.getAttribute('aria-label')).toBe('Confirmation');
        expect(popup()!.hasAttribute('aria-modal')).toBe(false);
        expect(document.getElementById(popup()!.getAttribute('aria-describedby')!)?.textContent?.trim()).toBe('Remove this item?');
        expect(document.activeElement).toBe(button('Yes'));
    });

    it('is named by its header and focuses reject when asked to', async () => {
        const { popup, button, require } = mountPopup();
        await require({ header: 'Remove', defaultFocus: 'reject' });
        expect(document.getElementById(popup()!.getAttribute('aria-labelledby')!)?.textContent).toBe('Remove');
        expect(document.activeElement).toBe(button('No'));
    });

    it('answers, closes and gives focus back to the target', async () => {
        const accept = vi.fn();
        const reject = vi.fn();
        const { popup, button, require, target } = mountPopup();
        await require({ accept, reject });
        button('Yes')!.click();
        await nextTick();
        expect(accept).toHaveBeenCalledTimes(1);
        expect(popup()).toBeNull();
        expect(document.activeElement).toBe(target());
        await require({ accept, reject });
        button('No')!.click();
        expect(reject).toHaveBeenCalledTimes(1);
    });

    it('keeps Tab inside and closes unanswered on Escape', async () => {
        const onHide = vi.fn();
        const { popup, button, require, target } = mountPopup();
        await require({ onHide });
        await press(button('Yes')!, 'Tab');
        expect(document.activeElement).toBe(button('No'));
        await press(button('No')!, 'Escape');
        await nextTick();
        expect(popup()).toBeNull();
        expect(onHide).toHaveBeenCalledTimes(1);
        expect(document.activeElement).toBe(target());
    });

    it('closes through useConfirm().close()', async () => {
        const { popup, require, api } = mountPopup();
        await require();
        api().close();
        await nextTick();
        expect(popup()).toBeNull();
    });

    it('has no accessibility violations, closed or open', async () => {
        const { require } = mountPopup();
        await expectNoA11yViolations();
        await require({ header: 'Remove', severity: 'danger' });
        await expectNoA11yViolations();
    });
});

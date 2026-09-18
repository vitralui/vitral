import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import InputText from '../InputText/InputText.vue';
import IconField from './IconField.vue';
import InputIcon from './InputIcon.vue';

function mountField(icons: { before?: Record<string, unknown>; after?: Record<string, unknown> }, props: Record<string, unknown> = {}) {
    return mountVt(
        defineComponent(() => () => [
            h('label', { for: 'q' }, 'Search'),
            h(IconField, props, () => [
                icons.before ? h(InputIcon, icons.before) : null,
                h(InputText, { id: 'q' }),
                icons.after ? h(InputIcon, icons.after) : null
            ])
        ])
    );
}

describe('IconField', () => {
    it('lays icons around a field that keeps its own label', async () => {
        mountField({ before: { icon: 'search' }, after: { icon: 'spinner', spin: true } }, { fluid: true });
        const root = document.querySelector('.vt-iconfield')!;
        expect(root.classList.contains('vt-iconfield-fluid')).toBe(true);
        const icons = root.querySelectorAll('.vt-inputicon');
        expect(icons).toHaveLength(2);
        expect(root.firstElementChild).toBe(icons[0]);
        expect(root.lastElementChild).toBe(icons[1]);
        expect(document.querySelector<HTMLInputElement>('#q')!.labels?.[0]?.textContent).toBe('Search');
        expect(icons[1]!.querySelector('.vt-icon-spin')).not.toBeNull();
    });

    it('hides a decorative icon and names a meaningful one', () => {
        mountField({ before: { icon: 'search' }, after: { icon: 'warning', label: 'Required' } });
        const icons = document.querySelectorAll('.vt-inputicon');
        expect(icons[0]!.getAttribute('aria-hidden')).toBe('true');
        expect(icons[1]!.hasAttribute('aria-hidden')).toBe(false);
        expect(icons[1]!.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Required');
    });

    it('drops its classes, for both parts, when unstyled', () => {
        mountField({ before: { icon: 'search' } }, { unstyled: true });
        expect(document.querySelector('.vt-iconfield')).toBeNull();
        expect(document.querySelector('.vt-inputicon')).toBeNull();
    });

    it('has no accessibility violations', async () => {
        mountField({ before: { icon: 'search' }, after: { icon: 'warning', label: 'Required' } });
        await expectNoA11yViolations();
    });
});

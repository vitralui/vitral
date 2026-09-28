import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import EmptyState from './EmptyState.vue';

describe('EmptyState', () => {
    it('shows an icon, a title, a description and its actions', () => {
        const wrapper = mountVt(EmptyState, {
            props: { title: 'No invoices', description: 'Invoices you send appear here.' },
            slots: { actions: () => h('button', 'New invoice') }
        });
        expect(wrapper.get('.vt-emptystate-title').text()).toBe('No invoices');
        expect(wrapper.get('.vt-emptystate-description').text()).toBe('Invoices you send appear here.');
        expect(wrapper.get('.vt-emptystate-icon').attributes('aria-hidden')).toBe('true');
        expect(wrapper.get('.vt-emptystate-actions button').text()).toBe('New invoice');
    });

    it("turns into a result with a severity, and takes the severity's icon", () => {
        const wrapper = mountVt(EmptyState, { props: { title: 'Paid', severity: 'success', size: 'large' } });
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-emptystate-success', 'vt-emptystate-lg']));
        expect(wrapper.find('.vt-emptystate-icon svg').exists()).toBe(true);
    });

    it('makes the title a heading when asked, and draws no icon when told', () => {
        const wrapper = mountVt(EmptyState, { props: { title: 'Nothing', headingLevel: 2, icon: false, align: 'start' } });
        expect(wrapper.get('.vt-emptystate-title').element.tagName).toBe('H2');
        expect(wrapper.find('.vt-emptystate-icon').exists()).toBe(false);
        expect(wrapper.classes()).toContain('vt-emptystate-start');
    });

    it('has no accessibility violations', async () => {
        mountVt(EmptyState, { props: { title: 'No results', description: 'Try another search.' } });
        mountVt(EmptyState, { props: { title: 'Failed', severity: 'danger', headingLevel: 2 } });
        await expectNoA11yViolations();
    });
});

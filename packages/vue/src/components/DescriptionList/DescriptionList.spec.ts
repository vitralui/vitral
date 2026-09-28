import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import DescriptionList from './DescriptionList.vue';

const items = [
    { label: 'Customer', value: 'Ana Souza' },
    { label: 'Order', value: 1042 },
    { label: 'Notes', value: null, span: 2 }
];

describe('DescriptionList', () => {
    it('lists each fact as a term and its description', () => {
        const wrapper = mountVt(DescriptionList, { props: { items, title: 'Order' } });
        expect(wrapper.findAll('dt').map((d) => d.text())).toEqual(['Customer', 'Order', 'Notes']);
        expect(wrapper.findAll('dd').map((d) => d.text())).toEqual(['Ana Souza', '1042', '—']);
        expect(wrapper.get('.vt-descriptionlist-title').text()).toBe('Order');
    });

    it('lays out in columns, lets an item span them, and takes the layout and look it is given', () => {
        const wrapper = mountVt(DescriptionList, { props: { items, columns: 3, layout: 'horizontal', bordered: true, labelWidth: '8rem' } });
        const list = wrapper.get('dl').element as HTMLElement;
        expect(list.style.getPropertyValue('--vt-descriptionlist-columns')).toBe('3');
        expect(list.style.getPropertyValue('--vt-descriptionlist-label-width')).toBe('8rem');
        expect((wrapper.findAll('.vt-descriptionlist-item')[2]!.element as HTMLElement).style.getPropertyValue('--vt-descriptionlist-span')).toBe('2');
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-descriptionlist-horizontal', 'vt-descriptionlist-bordered']));
    });

    it('draws values and the header from slots', () => {
        const wrapper = mountVt(DescriptionList, {
            props: { items },
            slots: { value: ({ item }: { item: { label: string } }) => h('strong', item.label.toUpperCase()), extra: () => h('button', 'Edit') }
        });
        expect(wrapper.get('dd strong').text()).toBe('CUSTOMER');
        expect(wrapper.get('.vt-descriptionlist-extra button').text()).toBe('Edit');
    });

    it('has no accessibility violations', async () => {
        mountVt(DescriptionList, { props: { items, title: 'Details', headingLevel: 2, columns: 2 } });
        await expectNoA11yViolations();
    });
});

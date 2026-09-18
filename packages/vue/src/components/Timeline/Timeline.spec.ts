import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Timeline from './Timeline.vue';

const events = [
    { status: 'Ordered', date: '15/10' },
    { status: 'Shipped', date: '16/10' },
    { status: 'Delivered', date: '18/10' }
];

describe('Timeline', () => {
    it('is an ordered list of events, with the drawing hidden', () => {
        const wrapper = mountVt(Timeline, {
            props: { value: events, dataKey: 'status' },
            attrs: { 'aria-label': 'Order history' },
            slots: {
                content: ({ item }: { item: (typeof events)[0] }) => item.status,
                opposite: ({ item }: { item: (typeof events)[0] }) => h('time', item.date)
            }
        });
        expect(wrapper.element.tagName).toBe('OL');
        expect(wrapper.attributes('aria-label')).toBe('Order history');
        const items = wrapper.findAll('li');
        expect(items.map((i) => i.find('.vt-timeline-content').text())).toEqual(['Ordered', 'Shipped', 'Delivered']);
        expect(items[0]!.find('time').text()).toBe('15/10');
        expect(items[0]!.find('.vt-timeline-separator').attributes('aria-hidden')).toBe('true');
        expect(wrapper.classes()).toEqual(['vt-timeline', 'vt-timeline-vertical', 'vt-timeline-align-left']);
    });

    it('lays out across the page, and pushes the axis to the start without opposite content', () => {
        const wrapper = mountVt(Timeline, { props: { value: events, layout: 'horizontal', align: 'alternate' }, slots: { content: () => 'x' } });
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-timeline-horizontal', 'vt-timeline-align-alternate', 'vt-timeline-no-opposite']));
    });

    it('takes custom markers', () => {
        const wrapper = mountVt(Timeline, { props: { value: events }, slots: { marker: ({ index }: { index: number }) => h('b', { class: 'm' }, index + 1) } });
        expect(wrapper.findAll('.m').map((m) => m.text())).toEqual(['1', '2', '3']);
    });

    it('has no accessibility violations', async () => {
        mountVt(Timeline, { props: { value: events }, slots: { content: ({ item }: { item: (typeof events)[0] }) => item.status } });
        await expectNoA11yViolations();
    });
});

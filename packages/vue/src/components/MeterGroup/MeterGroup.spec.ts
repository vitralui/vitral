import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import MeterGroup from './MeterGroup.vue';

const storage = [
    { label: 'Apps', value: 16 },
    { label: 'Messages', value: 8, color: 'tomato' },
    { label: 'Media', value: 24, icon: 'image' }
];

describe('MeterGroup', () => {
    it('is one named meter whose value text lists every part', async () => {
        const wrapper = mountVt(MeterGroup, { props: { value: storage }, attrs: { 'aria-label': 'Storage', class: 'wide' } });
        const meter = wrapper.find('[role="meter"]');
        expect(meter.attributes()).toMatchObject({ 'aria-label': 'Storage', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '48' });
        expect(meter.attributes('aria-valuetext')).toBe('Apps 16%, Messages 8%, Media 24%');
        expect(wrapper.classes()).toContain('wide');
        const segments = wrapper.findAll('.vt-metergroup-meter');
        expect(segments.map((s) => (s.element as HTMLElement).style.width)).toEqual(['16%', '8%', '24%']);
        expect((segments[1]!.element as HTMLElement).style.background).toBe('tomato');
        expect((segments[0]!.element as HTMLElement).style.background).toBe('var(--vt-chart-1)');
        expect(wrapper.findAll('li').map((l) => l.text())).toEqual(['Apps16%', 'Messages8%', 'Media24%']);
        await expectNoA11yViolations();
    });

    it('scales to its range and writes values through the template', () => {
        const wrapper = mountVt(MeterGroup, {
            props: { value: [{ label: 'Used', value: 50 }], max: 200, valueTemplate: '{value} percent', orientation: 'vertical' },
            attrs: { 'aria-label': 'Disk' }
        });
        expect(wrapper.find('[role="meter"]').attributes('aria-valuetext')).toBe('Used 25 percent');
        expect((wrapper.find('.vt-metergroup-meter').element as HTMLElement).style.height).toBe('25%');
        expect(wrapper.classes()).toContain('vt-metergroup-vertical');
    });
});

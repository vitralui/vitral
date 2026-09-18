import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Avatar from './Avatar.vue';

describe('Avatar', () => {
    it('shows a label, an icon or an image, in that order of preference', () => {
        expect(mountVt(Avatar, { props: { label: 'GW' } }).text()).toBe('GW');
        expect(mountVt(Avatar, { props: { icon: 'user' } }).find('svg.vt-avatar-icon').exists()).toBe(true);
        const image = mountVt(Avatar, { props: { image: '/a.png', label: 'ignored' } }).get('img');
        expect(image.attributes('src')).toBe('/a.png');
    });

    it('takes a size and a shape', () => {
        const wrapper = mountVt(Avatar, { props: { label: 'GW', size: 'xlarge', shape: 'circle' } });
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-avatar-xl', 'vt-avatar-circle']));
    });

    it('is decorative unless its image is given alternative text', () => {
        expect(mountVt(Avatar, { props: { image: '/a.png' } }).get('img').attributes('alt')).toBe('');
        expect(mountVt(Avatar, { props: { image: '/a.png', alt: 'Gustavo' } }).get('img').attributes('alt')).toBe('Gustavo');
    });

    it('has no accessibility violations', async () => {
        mountVt(Avatar, { props: { label: 'GW' } });
        mountVt(Avatar, { props: { image: '/a.png', alt: 'Gustavo', shape: 'circle' } });
        await expectNoA11yViolations();
    });
});

import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import QRCode from './QRCode.vue';

describe('QRCode', () => {
    it('draws the code as one path in a square view, named for what it says', () => {
        const wrapper = mountVt(QRCode, { props: { value: 'https://vitralui.github.io/vitral/' } });
        expect(wrapper.attributes('role')).toBe('img');
        expect(wrapper.attributes('aria-label')).toBe('https://vitralui.github.io/vitral/');
        const svg = wrapper.get('svg');
        const [, , w, h] = svg.attributes('viewBox')!.split(' ').map(Number);
        expect(w).toBe(h);
        expect(wrapper.findAll('path')).toHaveLength(1);
        expect(wrapper.get('path').attributes('d')!.length).toBeGreaterThan(100);
    });

    it('takes a margin, a size and colours, and a label of its own', () => {
        const wrapper = mountVt(QRCode, { props: { value: 'HELLO', margin: 0, size: '6rem', color: 'navy', label: 'Our website' } });
        expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 21 21');
        expect((wrapper.element as HTMLElement).style.width).toBe('6rem');
        expect((wrapper.get('path').element as SVGPathElement).style.fill).toBe('navy');
        expect(wrapper.attributes('aria-label')).toBe('Our website');
    });

    it('puts a logo in the middle and makes the code survive it', () => {
        const value = 'https://vitralui.github.io/vitral/components/qrcode/';
        const withLogo = mountVt(QRCode, { props: { value, image: '/logo.svg', margin: 0 } });
        const plain = mountVt(QRCode, { props: { value, margin: 0 } });
        expect(withLogo.find('img').attributes('alt')).toBe('');
        // Level H needs a larger code than M for the same text.
        const side = (w: typeof plain) => Number(w.get('svg').attributes('viewBox')!.split(' ')[2]);
        expect(side(withLogo)).toBeGreaterThan(side(plain));
    });

    it('draws nothing for a text too long to encode', () => {
        const wrapper = mountVt(QRCode, { props: { value: 'x'.repeat(4000) } });
        expect(wrapper.find('svg').exists()).toBe(false);
    });

    it('has no accessibility violations', async () => {
        mountVt(QRCode, { props: { value: 'https://example.com' } });
        await expectNoA11yViolations();
    });
});

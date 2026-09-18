import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import AspectRatio from './AspectRatio.vue';

describe('AspectRatio', () => {
    it('keeps the ratio it is given, even unstyled, around its content', async () => {
        const wrapper = mountVt(AspectRatio, { props: { ratio: 16 / 9 }, slots: { default: () => h('img', { src: 'x.png', alt: 'A lake' }) } });
        expect((wrapper.element as HTMLElement).style.aspectRatio).toBe(`${16 / 9} / 1`);
        expect(wrapper.find('img').attributes('alt')).toBe('A lake');
        await expectNoA11yViolations();
        const plain = mountVt(AspectRatio, { props: { unstyled: true, ratio: 2 } });
        expect((plain.element as HTMLElement).style.aspectRatio).toBe('2 / 1');
        expect(plain.classes()).toEqual([]);
    });

    it('falls back to a square for a ratio that makes no sense', () => {
        const wrapper = mountVt(AspectRatio, { props: { ratio: 0 } });
        expect((wrapper.element as HTMLElement).style.aspectRatio).toBe('1 / 1');
    });
});

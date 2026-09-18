import { ptBR } from '@vitral/core';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Breadcrumb from './Breadcrumb.vue';
import type { BreadcrumbItem } from './types';

const trail: BreadcrumbItem[] = [{ label: 'Products', url: '/products' }, { label: 'Hidden', visible: false }, { label: 'Laptops', url: '/products/laptops' }, { label: 'Vitral 14' }];

describe('Breadcrumb', () => {
    it('is a named navigation landmark around an ordered list', () => {
        const wrapper = mountVt(Breadcrumb, { props: { model: trail } });
        expect(wrapper.element.tagName).toBe('NAV');
        expect(wrapper.attributes('aria-label')).toBe('Breadcrumb');
        expect(wrapper.find('ol').exists()).toBe(true);
        expect(wrapper.findAll('a').map((a) => a.attributes('href'))).toEqual(['/products', '/products/laptops']);
    });

    it('marks the last item as the current page and hides the separators', () => {
        const wrapper = mountVt(Breadcrumb, { props: { model: trail } });
        const current = wrapper.findAll('[aria-current="page"]');
        expect(current).toHaveLength(1);
        expect(current[0]!.text()).toBe('Vitral 14');
        const separators = wrapper.findAll('.vt-breadcrumb-separator');
        expect(separators).toHaveLength(2);
        expect(separators.every((s) => s.attributes('aria-hidden') === 'true')).toBe(true);
    });

    it('names an icon-only home item from the locale', () => {
        const wrapper = mountVt(Breadcrumb, { props: { home: { url: '/' }, model: trail } });
        const home = wrapper.get('a');
        expect(home.attributes('href')).toBe('/');
        expect(home.text()).toBe('Home');
        expect(home.find('svg').attributes('aria-hidden')).toBe('true');
        const pt = mountVt(Breadcrumb, { props: { home: { url: '/' } } }, { theme: 'none', locale: ptBR });
        expect(pt.attributes('aria-label')).toBe('Trilha de navegação');
        expect(pt.get('a').text()).toBe('Início');
    });

    it('renders a command item as a button that runs it, and a disabled one as a disabled link', async () => {
        const command = vi.fn();
        const wrapper = mountVt(Breadcrumb, {
            props: {
                model: [
                    { label: 'Root', command },
                    { label: 'Archive', url: '/archive', disabled: true },
                    { label: 'Here' }
                ]
            }
        });
        const button = wrapper.get('button');
        expect(button.attributes('type')).toBe('button');
        await button.trigger('click');
        expect(command).toHaveBeenCalledWith(expect.objectContaining({ item: expect.objectContaining({ label: 'Root' }) }));
        const disabled = wrapper.get('[aria-disabled="true"]');
        expect(disabled.attributes('role')).toBe('link');
        expect(disabled.attributes('href')).toBeUndefined();
    });

    it('has no accessibility violations', async () => {
        mountVt(Breadcrumb, { props: { home: { url: '/' }, model: [...trail, { label: 'Archive', url: '/x', disabled: true }, { label: 'Run', command: () => {} }, { label: 'Now' }] } });
        await expectNoA11yViolations();
    });
});

import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import MegaMenu from './MegaMenu.vue';
import type { MegaMenuItem } from './types';

const settle = () => new Promise((resolve) => setTimeout(resolve, 5));

function model(run = vi.fn()): MegaMenuItem[] {
    return [
        {
            label: 'Products',
            items: [
                [{ label: 'Hardware', items: [{ label: 'Laptops', command: run }, { label: 'Phones', command: run }] }],
                [{ label: 'Software', items: [{ label: 'Editor', command: run, disabled: true }, { label: 'Cloud', command: run }] }]
            ]
        },
        { label: 'Company', items: [[{ label: 'About', items: [{ label: 'Team', command: run }] }]] },
        { label: 'Contact', url: '#contact' }
    ];
}

const items = () => Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]'));
const named = (label: string) => items().find((el) => el.textContent?.trim() === label)!;
const key = async (k: string) => {
    await press(document.activeElement!, k);
    await settle();
};

describe('MegaMenu', () => {
    it('is a menubar whose items open a panel of labelled groups', async () => {
        mountVt(MegaMenu, { props: { model: model(), ariaLabel: 'Site' } });
        const bar = document.querySelector('[role="menubar"]')!;
        expect(bar.getAttribute('aria-label')).toBe('Site');
        expect(items().map((i) => i.tabIndex)).toEqual([0, -1, -1]);
        named('Products').click();
        await nextTick();
        const panel = document.getElementById(named('Products').getAttribute('aria-controls')!)!;
        expect(panel.getAttribute('role')).toBe('menu');
        const groups = panel.querySelectorAll('[role="group"]');
        expect(groups).toHaveLength(2);
        expect(document.getElementById(groups[1]!.getAttribute('aria-labelledby')!)?.textContent).toBe('Software');
    });

    it('walks every column with Up and Down, skipping disabled links, and moves on to the next panel with Right from the last column', async () => {
        mountVt(MegaMenu, { props: { model: model(), ariaLabel: 'Site' } });
        named('Products').focus();
        await key('ArrowDown');
        expect(document.activeElement).toBe(named('Laptops'));
        await key('ArrowDown');
        await key('ArrowDown');
        expect(document.activeElement).toBe(named('Cloud'));
        await key('ArrowRight');
        expect(document.activeElement).toBe(named('Company'));
        expect(named('Company').getAttribute('aria-expanded')).toBe('true');
        await key('ArrowDown');
        expect(document.activeElement).toBe(named('Team'));
        await key('Escape');
        expect(document.activeElement).toBe(named('Company'));
        expect(named('Team')).toBeUndefined();
    });

    it('moves between columns with Left and Right, to the nearest enabled link at the same height', async () => {
        mountVt(MegaMenu, { props: { model: model(), ariaLabel: 'Site' } });
        named('Products').focus();
        await key('ArrowDown');
        await key('ArrowDown');
        expect(document.activeElement).toBe(named('Phones'));
        await key('ArrowRight');
        expect(document.activeElement).toBe(named('Cloud'));
        await key('ArrowLeft');
        expect(document.activeElement).toBe(named('Phones'));
        await key('ArrowUp');
        // Level with the disabled Editor: the nearest enabled link in that column.
        await key('ArrowRight');
        expect(document.activeElement).toBe(named('Cloud'));
        await key('ArrowLeft');
        await key('ArrowLeft');
        // No column to the left: on to the previous bar item, as in a menubar.
        expect(document.activeElement).toBe(named('Contact'));
    });

    it('places the open panel clear of its ancestors, under the bar', async () => {
        mountVt(MegaMenu, { props: { model: model(), ariaLabel: 'Site' } });
        named('Products').click();
        await settle();
        const panel = document.getElementById(named('Products').getAttribute('aria-controls')!)!;
        expect(panel.style.position).toBe('fixed');
        expect(panel.style.zIndex).not.toBe('');
        expect(panel.dataset.placement).toBe('bottom-start');
    });

    it('runs a link with Enter and closes the panel', async () => {
        const run = vi.fn();
        mountVt(MegaMenu, { props: { model: model(run), ariaLabel: 'Site' } });
        named('Company').focus();
        await key('Enter');
        await key('Enter');
        expect(run).toHaveBeenCalledTimes(1);
        expect(named('Team')).toBeUndefined();
    });

    it('opens beside a vertical menu', async () => {
        mountVt(MegaMenu, { props: { model: model(), orientation: 'vertical', ariaLabel: 'Site' } });
        expect(document.querySelector('[role="menu"]')!.getAttribute('aria-orientation')).toBe('vertical');
        named('Products').focus();
        await key('ArrowRight');
        expect(document.activeElement).toBe(named('Laptops'));
    });

    it('has no accessibility violations, closed or open', async () => {
        mountVt(MegaMenu, { props: { model: model(), ariaLabel: 'Site' } });
        await expectNoA11yViolations();
        named('Products').click();
        await nextTick();
        await expectNoA11yViolations();
    });
});

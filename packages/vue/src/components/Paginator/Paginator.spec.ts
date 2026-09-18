import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Paginator from './Paginator.vue';

function mountPager(props: Record<string, unknown> = {}) {
    const first = ref((props.first as number) ?? 0);
    const rows = ref((props.rows as number) ?? 10);
    const total = ref((props.totalRecords as number) ?? 95);
    const onPage = vi.fn();
    const wrapper = mountVt(
        defineComponent(
            () => () =>
                h(Paginator, {
                    ...props,
                    totalRecords: total.value,
                    first: first.value,
                    rows: rows.value,
                    'onUpdate:first': (v: number) => (first.value = v),
                    'onUpdate:rows': (v: number) => (rows.value = v),
                    onPage
                })
        )
    );
    const nav = () => document.querySelector<HTMLElement>('nav');
    const button = (name: string) => Array.from(document.querySelectorAll<HTMLButtonElement>('nav button')).find((b) => b.getAttribute('aria-label') === name)!;
    const pages = () => Array.from(document.querySelectorAll<HTMLButtonElement>('.vt-paginator-page'));
    const current = () => document.querySelector<HTMLButtonElement>('[aria-current="page"]');
    return { wrapper, first, rows, total, onPage, nav, button, pages, current };
}

describe('Paginator', () => {
    it('is a navigation landmark whose page buttons are named and mark the current page', () => {
        const { nav, pages, current, button } = mountPager();
        expect(nav()!.getAttribute('aria-label')).toBe('Pagination');
        expect(pages().map((p) => p.textContent?.trim())).toEqual(['1', '2', '3', '4', '5']);
        expect(pages()[0]!.getAttribute('aria-label')).toBe('Page 1');
        expect(current()!.textContent?.trim()).toBe('1');
        expect(button('First page').getAttribute('aria-disabled')).toBe('true');
        expect(button('Previous').getAttribute('aria-disabled')).toBe('true');
        expect(button('Next').hasAttribute('aria-disabled')).toBe(false);
    });

    it('moves between pages, keeps the window of links centred, and emits page', async () => {
        const { first, onPage, button, pages, current } = mountPager();
        button('Next').click();
        await nextTick();
        expect(first.value).toBe(10);
        expect(onPage).toHaveBeenLastCalledWith({ page: 1, first: 10, rows: 10, pageCount: 10 });
        expect(current()!.getAttribute('aria-label')).toBe('Page 2');

        pages()[4]!.click();
        await nextTick();
        expect(first.value).toBe(40);
        expect(pages().map((p) => p.textContent?.trim())).toEqual(['3', '4', '5', '6', '7']);

        button('Last page').click();
        await nextTick();
        expect(first.value).toBe(90);
        expect(button('Next').getAttribute('aria-disabled')).toBe('true');
        expect(pages().map((p) => p.textContent?.trim())).toEqual(['6', '7', '8', '9', '10']);
    });

    it('keeps focus on a disabled end button instead of dropping it, and ignores the press', async () => {
        const { first, onPage, button } = mountPager({ first: 80 });
        const next = button('Next');
        next.focus();
        next.click();
        await nextTick();
        expect(first.value).toBe(90);
        expect(document.activeElement).toBe(next);
        next.click();
        await nextTick();
        expect(first.value).toBe(90);
        expect(onPage).toHaveBeenCalledTimes(1);
    });

    it('reports the current range from the locale, or from a template', async () => {
        mountPager({ first: 20, template: 'PrevPageLink CurrentPageReport NextPageLink' });
        expect(document.querySelector('.vt-paginator-current')!.textContent).toBe('21–30 of 95');
        document.body.innerHTML = '';
        mountPager({ first: 20, template: ['CurrentPageReport'], currentPageReportTemplate: 'Page {page} of {pageCount}' });
        expect(document.querySelector('.vt-paginator-current')!.textContent).toBe('Page 3 of 10');
        expect(document.querySelector('.vt-paginator-first')).toBeNull();
    });

    it('changes the page size through a named select, keeping the first row on screen', async () => {
        const { rows, first, onPage } = mountPager({ first: 30, rowsPerPageOptions: [10, 25, 50] });
        const combobox = document.querySelector<HTMLButtonElement>('[role="combobox"]')!;
        expect(combobox.getAttribute('aria-label')).toBe('Rows per page');
        await press(combobox, 'ArrowDown');
        await press(combobox, 'ArrowDown');
        await press(combobox, 'Enter');
        expect(rows.value).toBe(25);
        expect(first.value).toBe(25);
        expect(onPage).toHaveBeenLastCalledWith({ page: 1, first: 25, rows: 25, pageCount: 4 });
    });

    it('moves to the last page that exists when the total shrinks', async () => {
        const { first, total } = mountPager({ first: 90 });
        total.value = 42;
        await nextTick();
        await nextTick();
        expect(first.value).toBe(40);
    });

    it('hides itself when one page is enough, unless told to always show', async () => {
        mountPager({ totalRecords: 8, alwaysShow: false });
        expect(document.querySelector('nav')).toBeNull();
        document.body.innerHTML = '';
        mountPager({ totalRecords: 8 });
        expect(document.querySelector('nav')).not.toBeNull();
    });

    it('has no accessibility violations', async () => {
        mountPager({ first: 20, rowsPerPageOptions: [10, 20], template: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown' });
        await expectNoA11yViolations();
    });
});

import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel, type AccordionValue } from './index';

const sections = [
    { value: 'a', title: 'Account', body: 'Name and email' },
    { value: 'b', title: 'Billing', body: 'Cards', disabled: true },
    { value: 'c', title: 'Privacy', body: 'Who sees what' },
    { value: 'd', title: 'Notifications', body: 'Email and push' }
];

function mountAccordion(props: Record<string, unknown> = {}) {
    const value = ref<AccordionValue>((props.value as AccordionValue | undefined) ?? 'a');
    const wrapper = mountVt(
        defineComponent(
            () => () =>
                h(Accordion, { ...props, value: value.value, 'onUpdate:value': (v: AccordionValue) => (value.value = v) }, () =>
                    sections.map((s) =>
                        h(AccordionPanel, { key: s.value, value: s.value, disabled: s.disabled }, () => [
                            h(AccordionHeader, null, () => s.title),
                            h(AccordionContent, null, () => h('p', s.body))
                        ])
                    )
                )
        )
    );
    const headers = () => Array.from(document.querySelectorAll<HTMLButtonElement>('.vt-accordion-header'));
    const regions = () => Array.from(document.querySelectorAll<HTMLElement>('[role="region"]'));
    return { wrapper, value, headers, regions };
}

describe('Accordion', () => {
    it('puts each header button in a heading, tied to its region both ways', () => {
        const { headers, regions } = mountAccordion();
        const first = headers()[0]!;
        expect(first.parentElement!.tagName).toBe('H3');
        expect(first.getAttribute('aria-expanded')).toBe('true');
        expect(first.getAttribute('aria-controls')).toBe(regions()[0]!.id);
        expect(regions()[0]!.getAttribute('aria-labelledby')).toBe(first.id);
        expect(headers()[2]!.getAttribute('aria-expanded')).toBe('false');
        expect(regions()[2]!.style.display).toBe('none');
        expect(headers()[1]!.disabled).toBe(true);
    });

    it('takes the heading level from the accordion', () => {
        const { headers } = mountAccordion({ headingLevel: 2 });
        expect(headers().every((b) => b.parentElement!.tagName === 'H2')).toBe(true);
    });

    it('keeps one panel open, closing the last when another opens', async () => {
        const { headers, value, regions } = mountAccordion();
        headers()[2]!.click();
        await Promise.resolve();
        expect(value.value).toBe('c');
        expect(headers()[0]!.getAttribute('aria-expanded')).toBe('false');
        expect(headers()[2]!.getAttribute('aria-expanded')).toBe('true');
        expect(regions()[2]!.style.display).toBe('');
        headers()[2]!.click();
        await Promise.resolve();
        expect(value.value).toBeNull();
    });

    it('with `multiple`, keeps a list of open panels', async () => {
        const { headers, value } = mountAccordion({ multiple: true, value: ['a'] });
        headers()[3]!.click();
        await Promise.resolve();
        expect(value.value).toEqual(['a', 'd']);
        headers()[0]!.click();
        await Promise.resolve();
        expect(value.value).toEqual(['d']);
        expect(headers()[3]!.getAttribute('aria-expanded')).toBe('true');
    });

    it('moves between headers with Down/Up (wrapping, skipping disabled) and Home/End', async () => {
        const { headers } = mountAccordion();
        const [a, , c, d] = headers();
        a!.focus();
        await press(a!, 'ArrowDown');
        expect(document.activeElement).toBe(c);
        await press(c!, 'ArrowUp');
        expect(document.activeElement).toBe(a);
        await press(a!, 'ArrowUp');
        expect(document.activeElement).toBe(d);
        await press(d!, 'ArrowDown');
        expect(document.activeElement).toBe(a);
        await press(a!, 'End');
        expect(document.activeElement).toBe(d);
        await press(d!, 'Home');
        expect(document.activeElement).toBe(a);
    });

    it('renders closed panels lazily when asked, pointing at no region until one exists', async () => {
        const { headers, regions } = mountAccordion({ lazy: true });
        expect(regions()).toHaveLength(1);
        expect(headers()[2]!.hasAttribute('aria-controls')).toBe(false);
        headers()[2]!.click();
        await Promise.resolve();
        expect(regions()).toHaveLength(1);
        expect(headers()[2]!.getAttribute('aria-controls')).toBe(regions()[0]!.id);
    });

    it('lets one `unstyled` on the accordion cover its parts', () => {
        mountAccordion({ unstyled: true });
        expect(document.querySelector('[class*="vt-accordion"]')).toBeNull();
    });

    it('has no accessibility violations', async () => {
        const { headers } = mountAccordion();
        await expectNoA11yViolations();
        headers()[3]!.click();
        await Promise.resolve();
        await expectNoA11yViolations();
    });
});

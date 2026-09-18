import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Step from './Step.vue';
import StepItem from './StepItem.vue';
import StepList from './StepList.vue';
import StepPanel from './StepPanel.vue';
import StepPanels from './StepPanels.vue';
import Stepper from './Stepper.vue';

const names = ['Account', 'Profile', 'Confirm'];

function mountTabs(props: Record<string, unknown> = {}) {
    const value = ref<string | number>('1');
    mountVt(
        defineComponent(() => () =>
            h(Stepper, { ...props, value: value.value, 'onUpdate:value': (v?: string | number) => (value.value = v ?? '1') }, () => [
                h(StepList, { 'aria-label': 'Sign-up steps' }, () => names.map((n, i) => h(Step, { value: String(i + 1) }, () => n))),
                h(StepPanels, () =>
                    names.map((n, i) =>
                        h(StepPanel, { value: String(i + 1) }, {
                            default: ({ activateCallback }: { activateCallback: (v: string) => void }) => [
                                h('p', `${n} form`),
                                i < 2 ? h('button', { class: 'next', onClick: () => activateCallback(String(i + 2)) }, 'Next') : null
                            ]
                        })
                    )
                )
            ])
        )
    );
    const tabs = () => Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const panel = () => document.querySelector<HTMLElement>('[role="tabpanel"]')!;
    return { value, tabs, panel };
}

describe('Stepper', () => {
    it('is a tablist of numbered steps controlling one panel', async () => {
        const { tabs, panel } = mountTabs();
        await nextTick();
        expect(document.querySelector('[role="tablist"]')!.getAttribute('aria-label')).toBe('Sign-up steps');
        expect(tabs().map((t) => t.textContent?.trim())).toEqual(['1Account', '2Profile', '3Confirm']);
        expect(tabs().map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
        expect(tabs()[0]!.getAttribute('aria-current')).toBe('step');
        expect(tabs()[0]!.getAttribute('aria-controls')).toBe(panel().id);
        expect(document.getElementById(panel().getAttribute('aria-labelledby')!)).toBe(tabs()[0]);
        expect(panel().textContent).toContain('Account form');
    });

    it('moves focus with the arrows and chooses with Enter', async () => {
        const { tabs, value, panel } = mountTabs();
        await nextTick();
        tabs()[0]!.focus();
        await press(tabs()[0]!, 'ArrowRight');
        expect(document.activeElement).toBe(tabs()[1]);
        expect(value.value).toBe('1');
        tabs()[1]!.click();
        await nextTick();
        expect(value.value).toBe('2');
        expect(panel().textContent).toContain('Profile form');
        await press(tabs()[1]!, 'End');
        expect(document.activeElement).toBe(tabs()[2]);
    });

    it('keeps later steps out of reach when linear, moving on from the panel', async () => {
        const { tabs, value, panel } = mountTabs({ linear: true });
        await nextTick();
        expect(tabs().map((t) => t.disabled)).toEqual([false, true, true]);
        panel().querySelector<HTMLButtonElement>('.next')!.click();
        await nextTick();
        expect(value.value).toBe('2');
        expect(tabs().map((t) => t.disabled)).toEqual([false, false, true]);
        expect(document.querySelectorAll('.vt-stepper-step-done')).toHaveLength(1);
    });

    it('pairs steps and panels in items as disclosures', async () => {
        const value = ref<string>('a');
        mountVt(
            defineComponent(() => () =>
                h(Stepper, { value: value.value, 'onUpdate:value': (v?: string | number) => (value.value = String(v)) }, () =>
                    ['a', 'b'].map((v) => h(StepItem, { value: v }, () => [h(Step, () => `Step ${v}`), h(StepPanel, () => `Panel ${v}`)]))
                )
            )
        );
        await nextTick();
        const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.vt-stepper-header'));
        expect(buttons[0]!.getAttribute('aria-expanded')).toBe('true');
        expect(buttons[0]!.hasAttribute('role')).toBe(false);
        const region = document.querySelector('[role="region"]')!;
        expect(region.textContent).toBe('Panel a');
        expect(buttons[0]!.getAttribute('aria-controls')).toBe(region.id);
        buttons[1]!.click();
        await nextTick();
        expect(value.value).toBe('b');
        expect(document.querySelector('[role="region"]')!.textContent).toBe('Panel b');
        await expectNoA11yViolations();
    });

    it('has no accessibility violations', async () => {
        mountTabs({ linear: true });
        await nextTick();
        await expectNoA11yViolations();
    });
});

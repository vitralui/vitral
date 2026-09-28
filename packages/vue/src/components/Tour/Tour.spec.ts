import { ptBR } from '@vitral/core';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import { useGlobalTour } from '../../composables/useGlobalTour';
import { useTour } from '../../composables/useTour';
import Tour from './Tour.vue';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const steps = [
    { element: '#one', popover: { title: 'One', description: 'The first.' } },
    { element: '#two', popover: { title: 'Two', description: 'The second.' } }
];

afterEach(() => {
    document.body.innerHTML = '';
});

function page() {
    document.body.insertAdjacentHTML('beforeend', '<button id="one">One</button><button id="two">Two</button>');
}

describe('Tour', () => {
    it('starts with v-model:open, follows v-model:step, and closes the model when it ends', async () => {
        page();
        const wrapper = mountVt(Tour, { props: { steps, open: false, 'onUpdate:open': (v: boolean) => wrapper.setProps({ open: v }), 'onUpdate:step': (v: number) => wrapper.setProps({ step: v }) } });
        await wrapper.setProps({ open: true });
        await tick();
        expect(document.querySelector('.vt-tour-title')!.textContent).toBe('One');
        await wrapper.setProps({ step: 1 });
        await tick();
        expect(document.querySelector('.vt-tour-title')!.textContent).toBe('Two');
        document.querySelector<HTMLButtonElement>('.vt-tour-next-button')!.click();
        await tick();
        expect((wrapper.props() as { open?: boolean }).open).toBe(false);
        expect(wrapper.emitted('end')![0]).toEqual([{ reason: 'complete', index: 1 }]);
        expect((wrapper.props() as { step?: number }).step).toBeUndefined();
        await wrapper.setProps({ open: true });
        await tick();
        expect(document.querySelector('.vt-tour-title')!.textContent).toBe('One');
        wrapper.unmount();
    });

    it('speaks the app locale and draws the content slot in the popover', async () => {
        page();
        const wrapper = mountVt(Tour, { props: { steps, open: true }, slots: { content: ({ index }: { index: number }) => h('em', `extra ${index}`) } }, { theme: 'none', locale: ptBR });
        await tick();
        expect(document.querySelector('.vt-tour-next-button')!.textContent).toBe('Próximo');
        expect(document.querySelector('.vt-tour-content em')!.textContent).toBe('extra 0');
        wrapper.unmount();
        expect(document.querySelector('.vt-tour-popover')).toBeNull();
    });

    it('is driven from code with useTour, and ended with the component', async () => {
        page();
        let tour: ReturnType<typeof useTour> | null = null;
        const Host = defineComponent({
            setup() {
                tour = useTour({ steps });
                return () => h('div');
            }
        });
        const wrapper = mountVt(Host);
        await tour!.drive(1);
        expect(tour!.getActiveIndex()).toBe(1);
        wrapper.unmount();
        await nextTick();
        expect(tour!.isActive()).toBe(false);
    });

    it("starts from the plugin's tour defaults, under its own props", async () => {
        page();
        const wrapper = mountVt(Tour, { props: { steps, open: true, progressStyle: 'bar' } }, { theme: 'none', tour: { showProgress: true, progressStyle: 'dots', dismissableMask: false } });
        await tick();
        expect(document.querySelector('.vt-tour-bar')).not.toBeNull();
        document.querySelector('.vt-tour-overlay-path')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await tick();
        expect(document.querySelector('.vt-tour-popover')).not.toBeNull();
        wrapper.unmount();
    });

    it('keeps one tour for the whole app, which outlives the page that started it, not the app', async () => {
        page();
        const seen: ReturnType<typeof useGlobalTour>[] = [];
        const Page = defineComponent({
            setup() {
                seen.push(useGlobalTour({ steps }));
                return () => h('div');
            }
        });
        // Two pages of one app, the way a router swaps them.
        const App = defineComponent({
            props: { at: { type: String, default: 'a' } },
            setup: (props) => () => h(Page, { key: props.at })
        });
        const app = mountVt(App, {}, { theme: 'none', tour: { showProgress: true } });
        const tour = seen[0]!;
        await tour.drive();
        expect(document.querySelector('.vt-tour-progress')!.textContent).toBe('1 of 2');
        await app.setProps({ at: 'b' });
        expect(seen[1]).toBe(tour);
        expect(tour.isActive()).toBe(true);
        await tour.moveNext();
        expect(document.querySelector('.vt-tour-title')!.textContent).toBe('Two');
        app.unmount();
        await nextTick();
        expect(tour.isActive()).toBe(false);
    });

    it('has no accessibility violations', async () => {
        page();
        const wrapper = mountVt(Tour, { props: { steps, open: true, showProgress: true } });
        await tick();
        await expectNoA11yViolations();
        wrapper.unmount();
    });
});

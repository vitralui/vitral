import { ptBR } from '@vitral/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTour, type TourHandle } from './index';

let tour: TourHandle | null = null;

function page() {
    document.body.innerHTML = `
        <button id="new">New</button>
        <input id="search" />
        <div id="panel">Panel</div>`;
}

const popover = () => document.querySelector<HTMLElement>('.vt-tour-popover');
const button = (name: 'next' | 'previous' | 'close') =>
    document.querySelector<HTMLButtonElement>(name === 'close' ? '.vt-tour-close-button' : `.vt-tour-${name}-button`)!;
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(page);
afterEach(() => {
    tour?.destroy();
    tour = null;
    document.body.innerHTML = '';
    localStorage.clear();
});

const steps = [
    { element: '#new', popover: { title: 'Create', description: 'Starts a new document.' } },
    { element: '#search', popover: { title: 'Search', description: 'Finds anything.' } },
    { element: '#panel', popover: { title: 'Panel', description: 'Your things.' } }
];

describe('createTour', () => {
    it('shows a step as a dialog named by its title and described by its text, and takes the keyboard', async () => {
        tour = createTour({ steps });
        await tour.drive();
        const dialog = popover()!;
        expect(dialog.getAttribute('role')).toBe('dialog');
        expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)!.textContent).toBe('Create');
        expect(document.getElementById(dialog.getAttribute('aria-describedby')!)!.textContent).toBe('Starts a new document.');
        expect(document.activeElement).toBe(dialog);
        expect(document.querySelector('#new')!.classList.contains('vt-tour-active-element')).toBe(true);
        expect(document.querySelector('.vt-tour-overlay-path')!.getAttribute('d')).toMatch(/^M0,0H/);
    });

    it('moves with the buttons, names the last one Done, and ends there', async () => {
        const end = vi.fn();
        tour = createTour({ steps, on: { end } });
        await tour.drive();
        expect(button('previous').disabled).toBe(true);
        button('next').click();
        await tick();
        expect(tour.getActiveIndex()).toBe(1);
        expect(document.querySelector('#new')!.classList.contains('vt-tour-active-element')).toBe(false);
        button('next').click();
        await tick();
        expect(tour.isLastStep()).toBe(true);
        expect(button('next').textContent).toBe('Done');
        button('next').click();
        await tick();
        expect(tour.isActive()).toBe(false);
        expect(popover()).toBeNull();
        expect(end).toHaveBeenCalledWith({ reason: 'complete', index: 2 });
    });

    it('calls the hooks in order: started, highlighted, rendered, deselected', async () => {
        const calls: string[] = [];
        tour = createTour({
            steps,
            onHighlightStarted: (_, step) => calls.push(`started ${step.popover!.title}`),
            onHighlighted: (_, step) => calls.push(`highlighted ${step.popover!.title}`),
            onDeselected: (_, step) => calls.push(`deselected ${step.popover!.title}`),
            onDestroyed: () => calls.push('destroyed'),
            onPopoverRender: (dom) => calls.push(`render ${dom.title.textContent}`)
        });
        await tour.drive();
        await tour.moveNext();
        tour.destroy();
        expect(calls).toEqual([
            'started Create',
            'highlighted Create',
            'render Create',
            'deselected Create',
            'started Search',
            'highlighted Search',
            'render Search',
            'deselected Search',
            'destroyed'
        ]);
    });

    it('lets a click hook take over a button, and onDestroyStarted decide whether to end', async () => {
        const onNextClick = vi.fn();
        const onDestroyStarted = vi.fn();
        tour = createTour({ steps, onNextClick, onDestroyStarted });
        await tour.drive();
        button('next').click();
        expect(onNextClick).toHaveBeenCalledOnce();
        expect(tour.getActiveIndex()).toBe(0);
        button('close').click();
        expect(onDestroyStarted).toHaveBeenCalledOnce();
        expect(tour.isActive()).toBe(true);
        tour.destroy();
        expect(tour.isActive()).toBe(false);
    });

    it('drives with the arrow keys and ends on Escape', async () => {
        tour = createTour({ steps });
        await tour.drive();
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        await tick();
        expect(tour.getActiveIndex()).toBe(1);
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        await tick();
        expect(tour.getActiveIndex()).toBe(0);
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(tour.isActive()).toBe(false);
    });

    it('passes over a step whose `when` says no, and counts only the steps it shows', async () => {
        tour = createTour({
            steps: [steps[0]!, { ...steps[1]!, when: () => false }, steps[2]!],
            showProgress: true
        });
        await tour.drive();
        expect(document.querySelector('.vt-tour-progress')!.textContent).toBe('1 of 2');
        await tour.moveNext();
        expect(tour.getActiveIndex()).toBe(2);
        expect(document.querySelector('.vt-tour-progress')!.textContent).toBe('2 of 2');
    });

    it('waits for beforeShow, and stays where it was when it says no', async () => {
        let allow = false;
        tour = createTour({ steps: [steps[0]!, { ...steps[1]!, beforeShow: async () => allow }] });
        await tour.drive();
        await tour.moveNext();
        expect(tour.getActiveIndex()).toBe(0);
        allow = true;
        await tour.moveNext();
        expect(tour.getActiveIndex()).toBe(1);
    });

    it('waits for an element to appear, and centres a step whose element never does', async () => {
        tour = createTour({ steps: [{ element: '#late', waitFor: 500, popover: { title: 'Late' } }] });
        setTimeout(() => document.body.insertAdjacentHTML('beforeend', '<div id="late">Late</div>'), 60);
        const started = Date.now();
        await tour.drive();
        // Found as it arrives, not on the next poll.
        expect(Date.now() - started).toBeLessThan(150);
        expect(tour.getActiveElement()?.id).toBe('late');
        tour.destroy();

        tour = createTour({ steps: [{ element: '#never', popover: { title: 'Nowhere' } }] });
        await tour.drive();
        expect(popover()!.classList.contains('vt-tour-popover-centered')).toBe(true);
    });

    it('takes a component instance as the element it renders', async () => {
        const panel = document.querySelector('#panel')!;
        tour = createTour({ steps: [{ element: () => ({ $el: panel }), popover: { title: 'Panel' } }] });
        await tour.drive();
        expect(tour.getActiveElement()).toBe(panel);
    });

    it('passes over a missing element when told to', async () => {
        tour = createTour({ missingElement: 'skip', steps: [{ element: '#never' }, steps[1]!] });
        await tour.drive();
        expect(tour.getActiveIndex()).toBe(1);
    });

    it('moves on by itself when the reader does what the step asks', async () => {
        tour = createTour({ steps: [{ ...steps[0]!, advanceOn: { event: 'click' } }, steps[1]!] });
        await tour.drive();
        document.querySelector<HTMLButtonElement>('#new')!.click();
        await tick();
        await tick();
        expect(tour.getActiveIndex()).toBe(1);
    });

    it('does what a press on the overlay is told to', async () => {
        tour = createTour({ steps, overlayClickBehavior: 'nextStep' });
        await tour.drive();
        document.querySelector('.vt-tour-overlay-path')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await tick();
        expect(tour.getActiveIndex()).toBe(1);
        tour.setConfig({ steps });
        document.querySelector('.vt-tour-overlay-path')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(tour.isActive()).toBe(false);
    });

    it('stays open on a press on the overlay when the mask is not dismissable, and draws no arrow unless asked', async () => {
        tour = createTour({ steps, dismissableMask: false });
        await tour.drive();
        expect(document.querySelector<HTMLElement>('.vt-tour-arrow')!.hidden).toBe(true);
        document.querySelector('.vt-tour-overlay-path')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(tour.isActive()).toBe(true);
        tour.update({ arrow: true });
        expect(document.querySelector<HTMLElement>('.vt-tour-arrow')!.hidden).toBe(false);
    });

    it('remembers where the reader got to, and that they finished', async () => {
        tour = createTour({ steps, storageKey: 'onboarding' });
        await tour.drive();
        await tour.moveNext();
        tour.destroy();
        tour = createTour({ steps, storageKey: 'onboarding' });
        await tour.drive();
        expect(tour.getActiveIndex()).toBe(1);
        await tour.moveNext();
        await tour.moveNext();
        expect(tour.isCompleted()).toBe(true);
        tour.reset();
        expect(tour.isCompleted()).toBe(false);
    });

    it('moves to a step by its id, and highlights one on its own', async () => {
        tour = createTour({ steps: steps.map((s, i) => ({ ...s, id: `s${i}` })) });
        await tour.drive('s2');
        expect(tour.getActiveIndex()).toBe(2);
        tour.destroy();
        await tour.highlight({ element: '#panel', popover: { description: 'Only this.' } });
        expect(button('next').hidden).toBe(true);
        expect(button('close').hidden).toBe(false);
        expect(popover()!.getAttribute('aria-label')).toBe('Step 1 of 1');
    });

    it('speaks the locale, draws dots or a bar, and keeps HTML as text unless allowed', async () => {
        tour = createTour({ steps: [{ element: '#new', popover: { title: '<b>Hi</b>' } }, steps[1]!], locale: ptBR, showProgress: true, progressStyle: 'dots' });
        await tour.drive();
        expect(button('next').textContent).toBe('Próximo');
        expect(document.querySelectorAll('.vt-tour-dot')).toHaveLength(2);
        expect(document.querySelector('.vt-tour-dot-active')).not.toBeNull();
        expect(document.querySelector('.vt-tour-title')!.textContent).toBe('<b>Hi</b>');
        tour.update({ allowHtml: true, progressStyle: 'bar' });
        expect(document.querySelector('.vt-tour-title b')).not.toBeNull();
        expect(document.querySelector<HTMLElement>('.vt-tour-bar-fill')!.style.width).toBe('50%');
    });

    it('lets an element be clicked unless told otherwise, and gives the keyboard back at the end', async () => {
        const search = document.querySelector<HTMLInputElement>('#search')!;
        search.focus();
        tour = createTour({ steps, disableActiveInteraction: true });
        await tour.drive();
        expect(document.querySelector('#new')!.classList.contains('vt-tour-inert-element')).toBe(true);
        tour.destroy();
        expect(document.querySelector('#new')!.className).toBe('');
        expect(document.activeElement).toBe(search);
    });


    it('does not animate unless asked, and takes a duration when it does', async () => {
        tour = createTour({ steps });
        await tour.drive();
        expect(document.querySelector('.vt-tour')!.classList.contains('vt-tour-animated')).toBe(false);
        tour.destroy();
        tour = createTour({ steps, animate: true, animationDuration: 500 });
        await tour.drive();
        const layer = document.querySelector<HTMLElement>('.vt-tour')!;
        expect(layer.style.getPropertyValue('--vt-tour-transition-duration')).toBe('500ms');
    });

    it('leaves the page where it is when told not to scroll, and scrolls smoothly when told to', async () => {
        const target = document.querySelector<HTMLElement>('#panel')!;
        target.getBoundingClientRect = () => ({ top: 5000, bottom: 5040, left: 0, right: 100, width: 100, height: 40, x: 0, y: 5000, toJSON: () => ({}) }) as DOMRect;
        const scrolled: ScrollIntoViewOptions[] = [];
        target.scrollIntoView = ((o: ScrollIntoViewOptions) => scrolled.push(o)) as never;
        tour = createTour({ steps: [steps[2]!], scrollIntoView: false });
        await tour.drive();
        expect(scrolled).toHaveLength(0);
        tour.destroy();
        tour = createTour({ steps: [steps[2]!], smoothScroll: true, scrollBlock: 'nearest' });
        await tour.drive();
        expect(scrolled[0]).toMatchObject({ behavior: 'smooth', block: 'nearest' });
    });

    it('goes to another page through the router it is given, then finds the step there', async () => {
        let path = '/';
        const navigate = vi.fn(async (page: string) => {
            path = page;
            document.body.insertAdjacentHTML('beforeend', '<div id="billing">Billing</div>');
        });
        tour = createTour({
            currentPage: () => path,
            navigate,
            steps: [steps[0]!, { element: '#billing', page: '/settings/billing', popover: { title: 'Billing' } }]
        });
        await tour.drive();
        await tour.moveNext();
        expect(navigate).toHaveBeenCalledWith('/settings/billing', expect.objectContaining({ index: 1 }));
        expect(tour.getActiveElement()?.id).toBe('billing');
    });

    it('without a router, loads the page and picks up there with resume()', async () => {
        const assign = vi.fn();
        const original = window.location;
        Object.defineProperty(window, 'location', { value: { ...original, pathname: '/', assign }, configurable: true });
        try {
            const tourSteps = [steps[0]!, { element: '#panel', page: '/reports', popover: { title: 'Reports' } }];
            tour = createTour({ steps: tourSteps });
            await tour.drive();
            await tour.moveNext();
            expect(assign).toHaveBeenCalledWith('/reports');
            expect(JSON.parse(localStorage.getItem('vt-tour')!)).toMatchObject({ index: 1, pending: true });
            tour.destroy();

            // The next page: the same tour, and the step it was on its way to.
            Object.defineProperty(window, 'location', { value: { ...original, pathname: '/reports', assign }, configurable: true });
            tour = createTour({ steps: tourSteps });
            expect(await tour.resume()).toBe(true);
            expect(tour.getActiveIndex()).toBe(1);
            expect(document.querySelector('.vt-tour-title')!.textContent).toBe('Reports');
            // Only once: a later visit does not start it again by itself.
            tour.destroy();
            tour = createTour({ steps: tourSteps });
            expect(await tour.resume()).toBe(false);
        } finally {
            Object.defineProperty(window, 'location', { value: original, configurable: true });
        }
    });
});


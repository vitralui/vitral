import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTooltip } from './tooltip';

function makeHost(): HTMLButtonElement {
    const host = document.createElement('button');
    host.textContent = 'Save';
    document.body.appendChild(host);
    return host;
}

const tip = () => document.querySelector<HTMLElement>('[role="tooltip"]');

/** Whether the host's focus counts as keyboard focus; jsdom infers it from its own event history, so the specs say it outright. */
function focusVisible(host: HTMLElement, visible: boolean) {
    const matches = host.matches.bind(host);
    vi.spyOn(host, 'matches').mockImplementation((selector: string) => (selector === ':focus-visible' ? visible && host === document.activeElement : matches(selector)));
}

describe('createTooltip', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        vi.useRealTimers();
        document.body.innerHTML = '';
    });

    it('shows on hover as a tooltip that describes its host', () => {
        const host = makeHost();
        const handle = createTooltip(host, { text: 'Save the file', rootAttrs: { class: 'vt-tooltip' }, textAttrs: { class: 'vt-tooltip-text' } });
        host.dispatchEvent(new MouseEvent('mouseenter'));
        expect(tip()?.textContent).toBe('Save the file');
        expect(tip()?.className).toBe('vt-tooltip');
        expect(tip()?.firstElementChild?.className).toBe('vt-tooltip-text');
        expect(host.getAttribute('aria-describedby')).toBe(handle.id);
        expect(tip()?.id).toBe(handle.id);
        expect(Number(tip()?.style.zIndex)).toBeGreaterThanOrEqual(1100);
    });

    it('waits for its show delay, and a leave before then cancels it', () => {
        const host = makeHost();
        createTooltip(host, { text: 'Later', showDelay: 300 });
        host.dispatchEvent(new MouseEvent('mouseenter'));
        vi.advanceTimersByTime(200);
        expect(tip()).toBeNull();
        host.dispatchEvent(new MouseEvent('mouseleave'));
        vi.advanceTimersByTime(500);
        expect(tip()).toBeNull();
        host.dispatchEvent(new MouseEvent('mouseenter'));
        vi.advanceTimersByTime(300);
        expect(tip()).not.toBeNull();
    });

    it('stays while the pointer crosses onto it, and goes when it leaves both', () => {
        const host = makeHost();
        createTooltip(host, { text: 'Hoverable' });
        host.dispatchEvent(new MouseEvent('mouseenter'));
        host.dispatchEvent(new MouseEvent('mouseleave'));
        tip()!.dispatchEvent(new MouseEvent('mouseenter'));
        vi.advanceTimersByTime(1000);
        expect(tip()).not.toBeNull();
        tip()!.dispatchEvent(new MouseEvent('mouseleave'));
        vi.advanceTimersByTime(1000);
        expect(tip()).toBeNull();
        expect(host.hasAttribute('aria-describedby')).toBe(false);
    });

    it('is dismissed by Escape, which goes no further', () => {
        const host = makeHost();
        const below = vi.fn();
        document.addEventListener('keydown', below);
        createTooltip(host, { text: 'Esc' });
        host.dispatchEvent(new MouseEvent('mouseenter'));
        host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(tip()).toBeNull();
        expect(below).not.toHaveBeenCalled();
        host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(below).toHaveBeenCalledTimes(1);
        document.removeEventListener('keydown', below);
    });

    it('shows on keyboard focus and hides on blur and on a press', () => {
        const host = makeHost();
        focusVisible(host, true);
        createTooltip(host, { text: 'Focus' });
        host.focus();
        expect(tip()).not.toBeNull();
        host.blur();
        expect(tip()).toBeNull();
        host.dispatchEvent(new MouseEvent('mouseenter'));
        host.dispatchEvent(new Event('pointerdown'));
        expect(tip()).toBeNull();
    });

    it('stays hidden when focus came from the pointer', () => {
        const host = makeHost();
        focusVisible(host, false);
        createTooltip(host, { text: 'Clicked' });
        host.focus();
        expect(tip()).toBeNull();
    });

    it('keeps the host’s own descriptions', () => {
        const host = makeHost();
        host.setAttribute('aria-describedby', 'hint');
        const handle = createTooltip(host, { text: 'Also' });
        host.dispatchEvent(new MouseEvent('mouseenter'));
        expect(host.getAttribute('aria-describedby')).toBe(`hint ${handle.id}`);
        handle.hide();
        expect(host.getAttribute('aria-describedby')).toBe('hint');
    });

    it('follows updates, hides when disabled or emptied, and is gone after destroy', () => {
        const host = makeHost();
        const handle = createTooltip(host, { text: 'One' });
        host.dispatchEvent(new MouseEvent('mouseenter'));
        handle.update({ text: 'Two' });
        expect(tip()?.textContent).toBe('Two');
        handle.update({ disabled: true });
        expect(tip()).toBeNull();
        host.dispatchEvent(new MouseEvent('mouseenter'));
        expect(tip()).toBeNull();
        handle.update({ disabled: false, text: '' });
        host.dispatchEvent(new MouseEvent('mouseenter'));
        expect(tip()).toBeNull();
        handle.update({ text: 'Three' });
        handle.destroy();
        host.dispatchEvent(new MouseEvent('mouseenter'));
        expect(tip()).toBeNull();
    });
});

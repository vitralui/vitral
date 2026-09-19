import { describe, expect, it } from 'vitest';
import { isTouchPress, keepFocus } from './press';

const press = (pointerType: string, target?: Element) => {
    const event = new PointerEvent('pointerdown', { pointerType, bubbles: true, cancelable: true });
    if (target) Object.defineProperty(event, 'target', { value: target });
    return event;
};

describe('a press that must not move focus', () => {
    it('is prevented for a mouse and for a pen', () => {
        for (const kind of ['mouse', 'pen']) {
            const event = press(kind);
            expect(keepFocus(event)).toBe(true);
            expect(event.defaultPrevented).toBe(true);
        }
    });

    it('is left alone for a finger, because the tap is built out of it', () => {
        const event = press('touch');
        expect(keepFocus(event)).toBe(false);
        expect(event.defaultPrevented).toBe(false);
        expect(isTouchPress(event)).toBe(true);
    });

    it('lets a named target through, so a search box inside a panel still takes the caret', () => {
        const input = document.createElement('input');
        const event = press('mouse', input);
        expect(keepFocus(event, (target) => target === input)).toBe(false);
        expect(event.defaultPrevented).toBe(false);
        const elsewhere = press('mouse', document.createElement('div'));
        expect(keepFocus(elsewhere, (target) => target === input)).toBe(true);
    });
});

import { afterEach, describe, expect, it } from 'vitest';
import { anchorTo } from './position';

afterEach(() => {
    document.body.innerHTML = '';
});

describe('an arrow on an anchored popup', () => {
    it('is put in the popup while it is attached, and taken out after', () => {
        const anchor = document.body.appendChild(document.createElement('button'));
        const popup = document.body.appendChild(document.createElement('div'));
        const stop = anchorTo(anchor, popup, { withArrow: true });
        const arrow = popup.querySelector('.vt-overlay-arrow');
        expect(arrow).not.toBeNull();
        expect(arrow!.getAttribute('aria-hidden')).toBe('true');
        // Half the arrow stands outside the popup, which must not clip it.
        expect(popup.classList.contains('vt-overlay-with-arrow')).toBe(true);
        stop();
        expect(popup.querySelector('.vt-overlay-arrow')).toBeNull();
        expect(popup.classList.contains('vt-overlay-with-arrow')).toBe(false);
    });

    it('is not drawn unless asked for', () => {
        const anchor = document.body.appendChild(document.createElement('button'));
        const popup = document.body.appendChild(document.createElement('div'));
        anchorTo(anchor, popup)();
        expect(popup.querySelector('.vt-overlay-arrow')).toBeNull();
    });
});

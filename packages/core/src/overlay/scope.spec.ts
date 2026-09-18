import { afterEach, describe, expect, it } from 'vitest';
import { overlayContainerOf } from './scope';
import { createTooltip } from './tooltip';

afterEach(() => (document.body.innerHTML = ''));

describe('overlay scopes', () => {
    it('sends a popup to the host of the nearest scope, else to the body', () => {
        document.body.innerHTML = `
            <div data-vt-overlay-scope id="outer">
                <div data-vt-overlay-scope id="inner"><button id="deep"></button><div data-vt-overlay-host id="inner-host"></div></div>
                <button id="shallow"></button>
                <div data-vt-overlay-host id="outer-host"></div>
            </div>
            <button id="free"></button>`;
        expect(overlayContainerOf(document.getElementById('deep'))!.id).toBe('inner-host');
        expect(overlayContainerOf(document.getElementById('shallow'))!.id).toBe('outer-host');
        expect(overlayContainerOf(document.getElementById('free'))).toBe(document.body);
    });

    it('opens a tooltip inside its scope', () => {
        document.body.innerHTML = '<div data-vt-overlay-scope><button id="host">?</button><div data-vt-overlay-host id="h"></div></div>';
        const tip = createTooltip(document.getElementById('host')!, { text: 'Help' });
        tip.show();
        expect(tip.element!.parentElement!.id).toBe('h');
        tip.destroy();
    });
});

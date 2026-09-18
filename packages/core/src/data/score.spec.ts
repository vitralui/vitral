import { describe, expect, it } from 'vitest';
import { commandScore } from './score';

describe('commandScore', () => {
    it('ranks the whole text, then a prefix, a word start, anywhere, and letters in order', () => {
        const scores = ['Settings', 'Settings and privacy', 'Open settings', 'Resettings', 'Save the image'].map((text) => commandScore(text, 'settings'));
        expect(scores[0]).toBe(1);
        expect(scores[1]).toBeLessThan(scores[0]!);
        expect(scores[2]).toBeLessThan(scores[1]!);
        expect(scores[3]).toBeLessThan(scores[2]!);
        expect(scores[4]).toBe(0);
        expect(commandScore('Go to page', 'gtp')).toBeGreaterThan(0);
        expect(commandScore('Go to page', 'gtp')).toBeLessThan(commandScore('Resettings', 'set'));
    });

    it('ignores case and accents, and an empty search matches everything', () => {
        expect(commandScore('Configurações', 'CONFIGURACOES')).toBe(1);
        expect(commandScore('Anything', '  ')).toBe(1);
    });

    it('needs every word, and the weakest decides', () => {
        expect(commandScore('Toggle dark mode', 'dark toggle')).toBeGreaterThan(0.7);
        expect(commandScore('Toggle dark mode', 'dark zebra')).toBe(0);
    });

    it('counts keywords a little less than the text', () => {
        expect(commandScore('Preferences', 'settings', ['settings'])).toBeCloseTo(0.95, 5);
        expect(commandScore('Preferences', 'settings')).toBe(0);
    });

    it('prefers the shorter of two equally good matches', () => {
        expect(commandScore('Copy', 'co')).toBeGreaterThan(commandScore('Copy link to clipboard', 'co'));
    });
});

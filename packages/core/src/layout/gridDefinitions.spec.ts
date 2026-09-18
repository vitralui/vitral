import { describe, expect, it } from 'vitest';
import { gridPlacement, gridTemplate, parseGridDefinitions, parseGridLength, splitGridDefinitions } from './gridDefinitions';

describe('grid definitions', () => {
    it('reads star-sized lengths as CSS track sizes', () => {
        expect(parseGridLength('Auto')).toBe('auto');
        expect(parseGridLength('auto')).toBe('auto');
        expect(parseGridLength('*')).toBe('1fr');
        expect(parseGridLength('2*')).toBe('2fr');
        expect(parseGridLength('0.5*')).toBe('0.5fr');
        expect(parseGridLength('120')).toBe('120px');
        expect(parseGridLength(48)).toBe('48px');
        expect(parseGridLength(' 1.5 ')).toBe('1.5px');
    });

    it('passes anything that is not track syntax through as CSS', () => {
        expect(parseGridLength('20%')).toBe('20%');
        expect(parseGridLength('10rem')).toBe('10rem');
        expect(parseGridLength('min-content')).toBe('min-content');
        expect(parseGridLength('minmax(8rem, 1fr)')).toBe('minmax(8rem, 1fr)');
    });

    it('splits on commas and whitespace, but not inside a CSS function', () => {
        expect(splitGridDefinitions('Auto,*,2*,120')).toEqual(['Auto', '*', '2*', '120']);
        expect(splitGridDefinitions('Auto * Auto')).toEqual(['Auto', '*', 'Auto']);
        expect(splitGridDefinitions(' 200 , minmax(8rem, 1fr) ,, * ')).toEqual(['200', 'minmax(8rem, 1fr)', '*']);
        expect(splitGridDefinitions('')).toEqual([]);
    });

    it('turns a definition list, text or array, into a template', () => {
        expect(parseGridDefinitions('Auto,*,2*,120')).toEqual(['auto', '1fr', '2fr', '120px']);
        expect(gridTemplate('200,*')).toBe('200px 1fr');
        expect(gridTemplate(['Auto', 120, '3*', 'repeat(2, 4rem)'])).toBe('auto 120px 3fr repeat(2, 4rem)');
        expect(gridTemplate(undefined)).toBeUndefined();
        expect(gridTemplate('')).toBeUndefined();
        expect(gridTemplate([])).toBeUndefined();
    });

    it('converts 0-based positions and spans to 1-based CSS lines', () => {
        expect(gridPlacement()).toBe('1 / span 1');
        expect(gridPlacement(0, 2)).toBe('1 / span 2');
        expect(gridPlacement(2, 3)).toBe('3 / span 3');
        expect(gridPlacement('1', '2')).toBe('2 / span 2');
        expect(gridPlacement(-4, 0)).toBe('1 / span 1');
        expect(gridPlacement(1.7, 2.4)).toBe('2 / span 2');
    });
});

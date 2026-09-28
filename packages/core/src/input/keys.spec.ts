import { describe, expect, it } from 'vitest';
import { keyCaps } from './keys';

describe('the caps of a shortcut', () => {
    it('draws the command key as the platform does', () => {
        expect(keyCaps('mod+k', true)).toEqual([{ label: '⌘', spoken: 'Command' }, { label: 'K' }]);
        expect(keyCaps('mod+k', false)).toEqual([{ label: 'Ctrl' }, { label: 'K' }]);
        expect(keyCaps('alt+shift+p', true).map((c) => c.label)).toEqual(['⌥', '⇧', 'P']);
        expect(keyCaps('alt+shift+p', false).map((c) => c.label)).toEqual(['Alt', 'Shift', 'P']);
    });

    it('takes an array as keys already split, and leaves names it does not know as written', () => {
        expect(keyCaps(['Ctrl', 'F5'], false).map((c) => c.label)).toEqual(['Ctrl', 'F5']);
        expect(keyCaps('Enter', false)).toEqual([{ label: '↵', spoken: 'Enter' }]);
    });

    it('reads a plus that is the key itself', () => {
        expect(keyCaps('+', false).map((c) => c.label)).toEqual(['+']);
        expect(keyCaps('ctrl++', false).map((c) => c.label)).toEqual(['Ctrl', '+']);
        expect(keyCaps(' ctrl + s ', false).map((c) => c.label)).toEqual(['Ctrl', 'S']);
    });
});

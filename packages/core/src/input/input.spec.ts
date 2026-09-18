import { describe, expect, it } from 'vitest';
import {
    isMaskComplete,
    isMaskEmpty,
    maskCaret,
    maskDelete,
    maskInsert,
    parseMask,
    parseMaskText,
    renderMask,
    trimmedMask,
    unmaskValue
} from './mask';
import { otpBackspace, otpBoxes, otpFill } from './otp';
import { passwordStrength, strengthRatio } from './password';

describe('mask', () => {
    const phone = parseMask('(999) 999-9999');
    const typed = (text: string) => maskInsert(phone, parseMaskText(phone, ''), 0, 0, text);

    it('parses slots, literals and the optional marker', () => {
        const tokens = parseMask('a*-9?99');
        expect(tokens.map((t) => (t.literal ?? (t.optional ? 'o' : 's')))).toEqual(['s', 's', '-', 's', 'o', 'o']);
        expect(renderMask(tokens, parseMaskText(tokens, ''))).toBe('__-___');
    });

    it('types characters into the slots, stepping over literals and refusing what a slot does not take', () => {
        const edit = typed('55x5123');
        expect(renderMask(phone, edit.slots)).toBe('(555) 123-____');
        expect(edit.caret).toBe(10);
        expect(unmaskValue(phone, edit.slots)).toBe('555123');
        expect(isMaskComplete(phone, edit.slots)).toBe(false);
        expect(isMaskComplete(phone, typed('5551234567').slots)).toBe(true);
    });

    it('steps over a literal typed where the pattern has it', () => {
        const date = parseMask('99/99/9999');
        const edit = maskInsert(date, parseMaskText(date, ''), 0, 0, '12/3');
        expect(renderMask(date, edit.slots)).toBe('12/3_/____');
    });

    it('reads masked or raw text, ignoring placeholders', () => {
        expect(renderMask(phone, parseMaskText(phone, '5551234567'))).toBe('(555) 123-4567');
        expect(renderMask(phone, parseMaskText(phone, '(555) 1__-____'))).toBe('(555) 1__-____');
        expect(isMaskEmpty(phone, parseMaskText(phone, '(___) ___-____'))).toBe(true);
        expect(renderMask(phone, parseMaskText(phone, null), '#')).toBe('(###) ###-####');
        const date = parseMask('99/99/9999');
        expect(renderMask(date, parseMaskText(date, ''), 'mm/dd/yyyy')).toBe('mm/dd/yyyy');
    });

    it('pushes characters right on an insert and pulls them left on a delete', () => {
        const start = typed('123456').slots;
        const inserted = maskInsert(phone, start, 1, 1, '9');
        expect(renderMask(phone, inserted.slots)).toBe('(912) 345-6___');
        expect(inserted.caret).toBe(2);
        const back = maskDelete(phone, inserted.slots, 2, 2, 'backward');
        expect(renderMask(phone, back.slots)).toBe('(123) 456-____');
        expect(back.caret).toBe(1);
        const forward = maskDelete(phone, start, 5, 5, 'forward');
        expect(renderMask(phone, forward.slots)).toBe('(123) 56_-____');
        expect(forward.caret).toBe(6);
        const range = maskDelete(phone, start, 2, 7, 'backward');
        expect(renderMask(phone, range.slots)).toBe('(156) ___-____');
        const replaced = maskInsert(phone, start, 1, 4, '7');
        expect(renderMask(phone, replaced.slots)).toBe('(745) 6__-____');
    });

    it('keeps a character out of a slot that refuses it when shifting', () => {
        const mixed = parseMask('9a');
        const slots = parseMaskText(mixed, '1b');
        expect(renderMask(mixed, maskInsert(mixed, slots, 0, 0, '2').slots)).toBe('1b');
        expect(maskDelete(mixed, slots, 0, 0, 'backward').caret).toBe(0);
    });

    it('places the caret on the first empty slot and trims an unfinished tail', () => {
        const slots = typed('555').slots;
        expect(maskCaret(phone, slots)).toBe(6);
        expect(trimmedMask(phone, slots)).toBe('(555');
        expect(trimmedMask(phone, parseMaskText(phone, ''))).toBe('');
        const optional = parseMask('99?99');
        expect(isMaskComplete(optional, parseMaskText(optional, '12'))).toBe(true);
    });
});

describe('password strength', () => {
    it('grades by the default expressions, or by custom ones', () => {
        expect(passwordStrength('')).toBeNull();
        expect(passwordStrength('abc')).toBe('weak');
        expect(passwordStrength('abc123')).toBe('medium');
        expect(passwordStrength('Abcdef12')).toBe('strong');
        expect(passwordStrength('aaaa', { mediumRegex: '^a{4}$' })).toBe('medium');
        expect(strengthRatio('medium')).toBeCloseTo(0.667, 2);
        expect(strengthRatio(null)).toBe(0);
    });
});

describe('otp', () => {
    it('splits a value into boxes and spreads typing or a paste across them', () => {
        expect(otpBoxes('12', 4)).toEqual(['1', '2', '', '']);
        expect(otpFill(['', '', '', ''], 0, '7')).toEqual({ boxes: ['7', '', '', ''], focus: 1 });
        expect(otpFill(['', '', '', ''], 1, '9a8 76', true)).toEqual({ boxes: ['', '9', '8', '7'], focus: 3 });
        expect(otpFill(['', ''], 0, 'x', true)).toEqual({ boxes: ['', ''], focus: 0 });
    });

    it('clears a box on Backspace, or the one before when it is empty', () => {
        expect(otpBackspace(['1', '2', ''], 1)).toEqual({ boxes: ['1', '', ''], focus: 1 });
        expect(otpBackspace(['1', '2', ''], 2)).toEqual({ boxes: ['1', '', ''], focus: 1 });
        expect(otpBackspace(['', ''], 0)).toEqual({ boxes: ['', ''], focus: 0 });
    });
});

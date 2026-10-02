import { describe, expect, it } from 'vitest';
import {
    isMaskComplete,
    isMaskEmpty,
    maskCaret,
    maskDelete,
    maskInsert,
    maskCase,
    maskPatternEdit,
    parseMask,
    parseMaskPattern,
    parseMaskText,
    pickMask,
    resolveMask,
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

describe('mask patterns that change with the value', () => {
    const cpfCnpj = ['999.999.999-99', '99.999.999/9999-99'];
    const show = (edit: { tokens: ReturnType<typeof parseMask>; slots: (string | null)[] }) => renderMask(edit.tokens, edit.slots);
    const type = (mask: Parameters<typeof pickMask>[0], text: string) => {
        const start = parseMaskPattern(mask, '');
        return maskPatternEdit(mask, start.tokens, start.slots, 0, 0, { text });
    };

    it('picks the first pattern with room for the characters, or the last', () => {
        expect(pickMask(cpfCnpj, '123')).toBe(cpfCnpj[0]);
        expect(pickMask(cpfCnpj, '12345678901')).toBe(cpfCnpj[0]);
        expect(pickMask(cpfCnpj, '123456789012')).toBe(cpfCnpj[1]);
        expect(pickMask(cpfCnpj, '1'.repeat(20))).toBe(cpfCnpj[1]);
        // A pattern whose slots refuse a character is passed over.
        expect(pickMask(['999', 'aaa'], 'ab')).toBe('aaa');
        expect(pickMask((raw) => (raw.length > 10 ? '(99) 99999-9999' : '(99) 9999-9999?9'), '11987654321')).toBe('(99) 99999-9999');
        expect(pickMask('99/99', 'anything')).toBe('99/99');
    });

    it('moves to the longer pattern as the twelfth digit is typed, keeping every digit', () => {
        const cpf = type(cpfCnpj, '12345678901');
        expect(show(cpf)).toBe('123.456.789-01');
        const cnpj = maskPatternEdit(cpfCnpj, cpf.tokens, cpf.slots, cpf.tokens.length, cpf.tokens.length, { text: '2' });
        expect(cnpj.pattern).toBe(cpfCnpj[1]);
        expect(show(cnpj)).toBe('12.345.678/9012-__');
        expect(cnpj.caret).toBe(16);
    });

    it('goes back to the shorter pattern when a digit is deleted', () => {
        const cnpj = type(cpfCnpj, '123456789012');
        const back = maskPatternEdit(cpfCnpj, cnpj.tokens, cnpj.slots, 15, 15, { remove: 'backward' });
        expect(back.pattern).toBe(cpfCnpj[0]);
        expect(show(back)).toBe('123.456.789-01');
        expect(back.caret).toBe(14);
    });

    it('inserts and replaces a selection in the middle', () => {
        const cpf = type(cpfCnpj, '123456');
        const inserted = maskPatternEdit(cpfCnpj, cpf.tokens, cpf.slots, 1, 1, { text: '9' });
        expect(show(inserted)).toBe('192.345.6__-__');
        expect(inserted.caret).toBe(2);
        const replaced = maskPatternEdit(cpfCnpj, cpf.tokens, cpf.slots, 0, 5, { text: '7' });
        expect(show(replaced)).toBe('756.___.___-__');
        const forward = maskPatternEdit(cpfCnpj, cpf.tokens, cpf.slots, 3, 3, { remove: 'forward' });
        expect(show(forward)).toBe('123.56_.___-__');
    });

    it('drops a character no pattern takes', () => {
        const edit = type(cpfCnpj, '12a3');
        expect(show(edit)).toBe('123.___.___-__');
        expect(edit.caret).toBe(4);
    });

    it('reads a value set from outside into its pattern, masked or raw', () => {
        expect(show(parseMaskPattern(cpfCnpj, '12.345.678/0001-90'))).toBe('12.345.678/0001-90');
        expect(show(parseMaskPattern(cpfCnpj, '12345678000190'))).toBe('12.345.678/0001-90');
        expect(show(parseMaskPattern(cpfCnpj, '123.456.789-01'))).toBe('123.456.789-01');
        expect(parseMaskPattern(cpfCnpj, null).pattern).toBe(cpfCnpj[0]);
    });
});

describe('masks as values', () => {
    it('resolves a pattern or an object, with the field winning over the mask', () => {
        expect(resolveMask('99')).toMatchObject({ pattern: '99', unmask: false, slotChar: '_', autoClear: true, case: undefined });
        const shared = { pattern: '99-aa', unmask: true, slotChar: '#', definitions: { '#': /x/ } };
        expect(resolveMask(shared)).toMatchObject({ unmask: true, slotChar: '#' });
        const local = resolveMask(shared, { unmask: false, slotChar: undefined, definitions: { h: /[0-9a-f]/ } });
        expect(local.unmask).toBe(false);
        expect(local.slotChar).toBe('#');
        expect(Object.keys(local.definitions)).toEqual(expect.arrayContaining(['9', 'a', '*', '#', 'h']));
    });

    it('turns letters to the mask case', () => {
        expect(maskCase('abc1', 'upper')).toBe('ABC1');
        expect(maskCase('ABC1', 'lower')).toBe('abc1');
        expect(maskCase('aB', undefined)).toBe('aB');
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

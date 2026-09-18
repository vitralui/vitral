import { describe, expect, it } from 'vitest';
import { defaultFormMessages, fillMessage } from './messages';
import { custom, email, equalsField, max, maxLength, min, minLength, pattern, required, rules, url, type Rule, type RuleContext } from './rules';

const ctx = (values: Record<string, unknown> = {}, messages = defaultFormMessages): RuleContext => ({
    path: 'field',
    values,
    messages,
    signal: new AbortController().signal,
    get: (p) => values[p],
    labelOf: (p) => (p === 'password' ? 'Password' : p)
});

const check = (rule: Rule, value: unknown, values?: Record<string, unknown>) => rule(value, ctx(values));

describe('messages', () => {
    it('fills placeholders and leaves unknown ones', () => {
        expect(fillMessage('At least {min}, not {other}', { min: 3 })).toBe('At least 3, not {other}');
        expect(fillMessage('On {date}', { date: new Date(2026, 0, 2) })).toBe(`On ${new Date(2026, 0, 2).toLocaleDateString()}`);
    });
});

describe('rules', () => {
    it('required refuses empty text, lists, null and false', () => {
        const rule = required();
        expect(rule.isRequired).toBe(true);
        for (const value of [undefined, null, '', '  ', [], false]) expect(check(rule, value)).toBe(defaultFormMessages.required);
        for (const value of ['a', 0, [1], true, new Date()]) expect(check(rule, value)).toBeUndefined();
        expect(check(required(undefined, { acceptFalse: true }), false)).toBeUndefined();
        expect(check(required('Enter your name'), '')).toBe('Enter your name');
        expect(check(required(({ path }) => `${path} is missing`), '')).toBe('field is missing');
    });

    it('uses the messages it is given, as a locale would', () => {
        const messages = { ...defaultFormMessages, required: 'Obrigatório.', minLength: 'Mínimo {min}.' };
        expect(required()('', ctx({}, messages))).toBe('Obrigatório.');
        expect(minLength(3)('ab', ctx({}, messages))).toBe('Mínimo 3.');
    });

    it('minLength and maxLength count characters or items, and skip empty values', () => {
        expect(check(minLength(3), 'ab')).toBe('Enter at least 3 characters.');
        expect(check(minLength(3), 'abc')).toBeUndefined();
        expect(check(minLength(3), '')).toBeUndefined();
        expect(check(minLength(2), ['a'])).toBe('Choose or add at least 2.');
        expect(check(minLength(1), [])).toBe('Choose or add at least 1.');
        expect(check(minLength(1), null)).toBeUndefined();
        expect(check(maxLength(2), 'abc')).toBe('Enter no more than 2 characters.');
        expect(check(maxLength(2), ['a', 'b', 'c'])).toBe('Choose or add no more than 2.');
        expect(check(maxLength(2), 'ab')).toBeUndefined();
        expect(check(maxLength(2), 42)).toBeUndefined();
        expect(check(minLength(2, 'Too short: {length}/{min}'), 'a')).toBe('Too short: 1/2');
    });

    it('min and max compare numbers, numeric text and dates', () => {
        expect(check(min(18), 17)).toBe('Enter 18 or more.');
        expect(check(min(18), 18)).toBeUndefined();
        expect(check(min(18), '20')).toBeUndefined();
        expect(check(min(18), null)).toBeUndefined();
        expect(check(min(18), 'abc')).toBe(defaultFormMessages.invalid);
        expect(check(max(10), 11)).toBe('Enter 10 or less.');
        expect(check(max(10), 10)).toBeUndefined();
        const today = new Date(2026, 8, 16);
        expect(check(min(today), new Date(2026, 8, 15))).toBe(`Enter ${today.toLocaleDateString()} or more.`);
        expect(check(max(today), new Date(2026, 8, 17))).toBe(`Enter ${today.toLocaleDateString()} or less.`);
        expect(check(max(today), new Date(2026, 8, 16))).toBeUndefined();
    });

    it('pattern tests the value, even with a global expression', () => {
        const rule = pattern(/^\d{5}$/g);
        expect(check(rule, '12345')).toBeUndefined();
        expect(check(rule, '12345')).toBeUndefined();
        expect(check(rule, '1234')).toBe(defaultFormMessages.pattern);
        expect(check(rule, '')).toBeUndefined();
        expect(check(pattern(/^[A-Z]/, 'Start with a capital'), 'abc')).toBe('Start with a capital');
    });

    it('email accepts addresses and refuses the rest', () => {
        for (const value of ['a@b.co', 'first.last+tag@sub.example.com', ' x@y.org ']) expect(check(email(), value)).toBeUndefined();
        for (const value of ['a@b', 'a@', '@b.com', 'a b@c.com', 'a@b..com']) expect(check(email(), value)).toBe(defaultFormMessages.email);
        expect(check(email(), '')).toBeUndefined();
    });

    it('url accepts absolute web addresses', () => {
        expect(check(url(), 'https://example.com/path?q=1')).toBeUndefined();
        expect(check(url(), 'http://localhost:5180')).toBeUndefined();
        expect(check(url(), 'example.com')).toBe(defaultFormMessages.url);
        expect(check(url(), 'ftp://example.com')).toBe(defaultFormMessages.url);
        expect(check(url(undefined, { protocols: ['ftp:'] }), 'ftp://example.com')).toBeUndefined();
        expect(check(url(), 'javascript:alert(1)')).toBe(defaultFormMessages.url);
    });

    it('equalsField compares with another field and names it', () => {
        const rule = equalsField('password');
        expect(rule.deps).toEqual(['password']);
        expect(check(rule, 'abc', { password: 'abc' })).toBeUndefined();
        expect(check(rule, 'abd', { password: 'abc' })).toBe('This has to match Password.');
        expect(check(rule, '', { password: '' })).toBeUndefined();
    });

    it('custom turns a predicate into a rule, sync or async', async () => {
        expect(check(custom((v) => v !== 'admin', 'That name is taken.'), 'admin')).toBe('That name is taken.');
        expect(check(custom((v) => v !== 'admin'), 'admin')).toBe(defaultFormMessages.invalid);
        expect(check(custom((v) => v !== 'admin'), 'root')).toBeUndefined();
        expect(check(custom(() => 'Own message'), 'x')).toBe('Own message');
        expect(check(custom(() => true), 'x')).toBeUndefined();
        await expect(check(custom(async (v) => v === 'ok', 'Nope'), 'no')).resolves.toBe('Nope');
        await expect(check(custom(async (v) => v === 'ok', 'Nope'), 'ok')).resolves.toBeUndefined();
        expect(custom(() => true, undefined, { deps: ['a'] }).deps).toEqual(['a']);
    });

    it('gathers every rule on one object', () => {
        expect(Object.keys(rules).sort()).toEqual(['custom', 'email', 'equalsField', 'max', 'maxLength', 'min', 'minLength', 'pattern', 'required', 'url']);
    });
});

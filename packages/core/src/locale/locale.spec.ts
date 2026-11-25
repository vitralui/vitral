import { describe, expect, it } from 'vitest';
import { en, formatMessage, ptBR } from './locale';

describe('formatMessage', () => {
    it('fills names, and leaves one it was not given', () => {
        expect(formatMessage('{a} and {b}', { a: 1 })).toBe('1 and {b}');
    });

    it('picks the words for a number: an exact match, then the language’s category, then other', () => {
        const cards = '{count, plural, =0 {No cards} one {# card} other {# cards}} in {column}';
        expect([0, 1, 2].map((count) => formatMessage(cards, { count, column: 'Done' }))).toEqual(['No cards in Done', '1 card in Done', '2 cards in Done']);
        // A count already formatted keeps its format.
        expect(formatMessage(cards, { count: '1,234', column: 'Done' })).toBe('1,234 cards in Done');
    });

    it('reads the language’s own categories', () => {
        // Portuguese calls 0 and 1 "one"; English only 1.
        expect(formatMessage('{n, plural, one {singular} other {plural}}', { n: 0 }, 'pt-BR')).toBe('singular');
        expect(formatMessage('{n, plural, one {singular} other {plural}}', { n: 0 }, 'en')).toBe('plural');
    });

    it('says one card, not one cards, in both languages it ships', () => {
        expect(formatMessage(en.aria.taskboardCount, { count: 1 }, en.code)).toBe('1 card');
        expect(formatMessage(ptBR.aria.taskboardCount, { count: 1 }, ptBR.code)).toBe('1 cartão');
        expect(formatMessage(ptBR.datagrid.statusRows, { count: 0 }, ptBR.code)).toBe('Nenhuma linha');
        expect(formatMessage(en.searchMessage, { count: 1 }, en.code)).toBe('1 result is available');
    });
});

import { normalizeText } from './filter';

/**
 * How well `search` matches `text`, from 0 (not at all) to 1 (the same text),
 * for ranking a command palette's results. Case and accents are
 * ignored. In order of preference: the whole text, a prefix, the start of a
 * word, anywhere, and last the letters in order with gaps ("gtp" for "Go to
 * page"). With several words, each has to match and the weakest decides.
 * Keywords count a little less than the text itself.
 */
export function commandScore(text: string, search: string, keywords: readonly string[] = [], locale?: string): number {
    const words = normalizeText(search, locale).split(/\s+/).filter(Boolean);
    if (!words.length) return 1;
    const own = rank(normalizeText(text, locale).trim(), words);
    const viaKeywords = keywords.reduce((best, keyword) => Math.max(best, rank(normalizeText(keyword, locale).trim(), words) * 0.95), 0);
    return Math.max(own, viaKeywords);
}

function rank(text: string, words: string[]): number {
    const whole = words.join(' ');
    if (text === whole) return 1;
    let weakest = 1;
    for (const word of words) {
        weakest = Math.min(weakest, wordScore(text, word));
        if (!weakest) return 0;
    }
    // A shorter text that matches as well is the more likely target.
    return weakest - Math.min(text.length, 100) / 10000;
}

function wordScore(text: string, word: string): number {
    if (text.startsWith(word)) return 0.9;
    const at = text.indexOf(word);
    if (at > 0) return isWordStart(text, at) ? 0.8 : 0.6;
    return fuzzy(text, word);
}

const isWordStart = (text: string, index: number) => index === 0 || /[\s\-_/.:]/.test(text[index - 1]!);

/** The letters of `word` in order: better the more of them start a word or follow the previous one. */
function fuzzy(text: string, word: string): number {
    let from = 0;
    let good = 0;
    let previous = -2;
    for (const char of word) {
        const index = text.indexOf(char, from);
        if (index < 0) return 0;
        if (index === previous + 1 || isWordStart(text, index)) good++;
        previous = index;
        from = index + 1;
    }
    return 0.1 + 0.4 * (good / word.length);
}

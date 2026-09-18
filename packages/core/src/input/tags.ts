/**
 * A field whose value is a list of short strings, each shown as a token the
 * reader can remove. What a keystroke, a paste or a blur does to that list is
 * decided here: the component draws the tokens and owns the focus.
 */

export interface TagOptions {
    /** What ends a tag as it is typed. A string is one separator; `','` is the usual one. */
    separator?: string | readonly string[];
    /** How many tags the field holds; the rest are refused. */
    max?: number;
    /** Keep a tag that is already in the list. Off by default. */
    allowDuplicate?: boolean;
    /** Keep the spaces around a tag. Off by default. */
    keepSpace?: boolean;
    /** Refuse a tag; the text stays in the box for the reader to fix. */
    validate?: (tag: string) => boolean;
}

export interface TagEdit {
    /** The list after the edit. */
    tags: string[];
    /** What is left in the text box: the empty string when everything was taken. */
    text: string;
    /** Tags that were not taken, and why. */
    rejected: { tag: string; reason: 'duplicate' | 'max' | 'invalid' }[];
}

const separatorsOf = (options: TagOptions): string[] => {
    const given = options.separator ?? ',';
    return (typeof given === 'string' ? [given] : [...given]).filter(Boolean);
};

/** Splits text on every separator at once, keeping the pieces in order. */
export function splitTags(text: string, options: TagOptions = {}): string[] {
    const separators = separatorsOf(options);
    if (!separators.length) return [text];
    let parts = [text];
    for (const separator of separators) parts = parts.flatMap((part) => part.split(separator));
    return parts;
}

/**
 * Adds what was typed to the list. Text holding separators becomes several
 * tags — which is what a paste of "one, two, three" means — and anything
 * refused is reported rather than dropped silently.
 */
export function addTags(current: readonly string[], text: string, options: TagOptions = {}): TagEdit {
    const tags = [...current];
    const rejected: TagEdit['rejected'] = [];
    const clean = (tag: string) => (options.keepSpace ? tag : tag.trim());
    for (const raw of splitTags(text, options)) {
        const tag = clean(raw);
        if (!tag) continue;
        if (options.max !== undefined && tags.length >= options.max) {
            rejected.push({ tag, reason: 'max' });
            continue;
        }
        if (!options.allowDuplicate && tags.includes(tag)) {
            rejected.push({ tag, reason: 'duplicate' });
            continue;
        }
        if (options.validate && !options.validate(tag)) {
            rejected.push({ tag, reason: 'invalid' });
            continue;
        }
        tags.push(tag);
    }
    return { tags, text: '', rejected };
}

/**
 * What the text box holds after a keystroke. Text that ends in a separator is
 * committed, so typing `blue,` adds `blue` without waiting for Enter, and a
 * paste of a whole line is split at once.
 */
export function typeTags(current: readonly string[], text: string, options: TagOptions = {}): TagEdit | null {
    const separators = separatorsOf(options);
    if (!separators.some((separator) => text.includes(separator))) return null;
    const pieces = splitTags(text, options);
    // The last piece has no separator after it: it is still being typed.
    const trailing = pieces.pop() ?? '';
    const edit = addTags(current, pieces.join(separators[0] ?? ','), options);
    return { ...edit, text: options.keepSpace ? trailing : trailing.trimStart() };
}

/** The list with one tag taken out, by position. */
export function removeTag(current: readonly string[], index: number): string[] {
    if (index < 0 || index >= current.length) return [...current];
    return current.filter((_, i) => i !== index);
}

/**
 * Where focus goes after a key pressed in the text box, when the box is empty:
 * Backspace takes the last tag off, and the arrow keys walk the tags so one
 * can be removed without the mouse. `-1` is the text box itself.
 */
export function tagKeyTarget(key: string, focused: number, count: number, rtl = false): number | null {
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    if (!count) return null;
    switch (key) {
        case back:
            return focused === -1 ? count - 1 : Math.max(0, focused - 1);
        case forward:
            return focused === -1 ? -1 : focused + 1 >= count ? -1 : focused + 1;
        case 'Home':
            return 0;
        case 'End':
            return count - 1;
        default:
            return null;
    }
}

/**
 * The arithmetic of a masked text box, in the manner of the jQuery masked
 * input: a pattern of slots and literals, where `9` takes a digit, `a` a
 * letter, `*` either, and everything after `?` may be left empty. Any other character is a literal the box types
 * for the reader.
 *
 * The state is one entry per position of the pattern, the character in a slot
 * or null, so an edit is a pure function from one state to the next, and the
 * text is always `renderMask` of the state. No DOM is involved: the component
 * reads the caret and writes the text, this decides what goes where.
 */

export interface MaskToken {
    /** The character a literal position always shows. */
    literal?: string;
    /** What a slot accepts. */
    test?: RegExp;
    /** A slot after the `?` marker, which the value may leave empty. */
    optional: boolean;
}

export type MaskDefinitions = Record<string, RegExp>;

export const defaultMaskDefinitions: MaskDefinitions = {
    '9': /[0-9]/,
    a: /[A-Za-z]/,
    '*': /[A-Za-z0-9]/
};

/** One entry per pattern position: a slot's character, or null for an empty slot and for a literal. */
export type MaskSlots = (string | null)[];

export interface MaskEdit {
    slots: MaskSlots;
    /** Where the caret goes after the edit. */
    caret: number;
}

export function parseMask(mask: string, definitions: MaskDefinitions = defaultMaskDefinitions): MaskToken[] {
    const tokens: MaskToken[] = [];
    let optional = false;
    for (const char of mask) {
        if (char === '?') {
            optional = true;
            continue;
        }
        const test = definitions[char];
        tokens.push(test ? { test, optional } : { literal: char, optional });
    }
    return tokens;
}

const isSlot = (token: MaskToken | undefined): boolean => !!token?.test;

/** The first slot at or after `from`, or the pattern's length when there is none. */
export function nextSlot(tokens: readonly MaskToken[], from: number): number {
    let i = Math.max(0, from);
    while (i < tokens.length && !isSlot(tokens[i])) i++;
    return i;
}

/** The last slot before `from`, or -1. */
export function previousSlot(tokens: readonly MaskToken[], from: number): number {
    let i = Math.min(from, tokens.length) - 1;
    while (i >= 0 && !isSlot(tokens[i])) i--;
    return i;
}

export function emptyMask(tokens: readonly MaskToken[]): MaskSlots {
    return tokens.map(() => null);
}

/**
 * The text a state shows. `slotChar` fills the empty slots: one character, or
 * a string as long as the pattern to read a per-position placeholder from
 * (`'mm/dd/yyyy'`).
 */
export function renderMask(tokens: readonly MaskToken[], slots: MaskSlots, slotChar = '_'): string {
    return tokens
        .map((token, i) => {
            if (token.literal !== undefined) return token.literal;
            const value = slots[i];
            if (value) return value;
            return slotChar.length > 1 ? (slotChar[i] ?? '_') : slotChar;
        })
        .join('');
}

/**
 * The text a state holds so far, trimmed after the last filled slot. This is what the
 * box shows once it loses focus, so a half-typed optional tail does not leave
 * a trail of placeholders.
 */
export function trimmedMask(tokens: readonly MaskToken[], slots: MaskSlots, slotChar = '_'): string {
    const last = lastFilled(tokens, slots);
    if (last < 0) return '';
    return renderMask(tokens, slots, slotChar).slice(0, last + 1);
}

function lastFilled(tokens: readonly MaskToken[], slots: MaskSlots): number {
    for (let i = tokens.length - 1; i >= 0; i--) if (isSlot(tokens[i]) && slots[i]) return i;
    return -1;
}

/** The characters typed into the slots, without the literals: the "unmasked" value. */
export function unmaskValue(tokens: readonly MaskToken[], slots: MaskSlots): string {
    return tokens.map((token, i) => (isSlot(token) ? (slots[i] ?? '') : '')).join('');
}

/** Whether every slot before the `?` marker holds a character. */
export function isMaskComplete(tokens: readonly MaskToken[], slots: MaskSlots): boolean {
    return tokens.every((token, i) => !isSlot(token) || token.optional || !!slots[i]);
}

/** Whether anything at all has been typed. */
export function isMaskEmpty(tokens: readonly MaskToken[], slots: MaskSlots): boolean {
    return lastFilled(tokens, slots) < 0;
}

/**
 * Reads text into slots: masked text (`(555) 123-4567`), raw characters
 * (`5551234567`) or anything in between. Literals in the text are passed over
 * where the pattern has them; a character a slot refuses is dropped, as is the
 * placeholder character.
 */
export function parseMaskText(tokens: readonly MaskToken[], text: string | null | undefined, slotChar = '_'): MaskSlots {
    const slots = emptyMask(tokens);
    if (!text) return slots;
    let pos = 0;
    for (const char of text) {
        if (pos >= tokens.length) break;
        const here = tokens[pos]!;
        if (here.literal !== undefined && here.literal === char) {
            pos++;
            continue;
        }
        const slot = nextSlot(tokens, pos);
        if (slot >= tokens.length) break;
        const placeholder = slotChar.length > 1 ? slotChar[slot] : slotChar;
        if (char === placeholder) {
            pos = slot + 1;
            continue;
        }
        if (tokens[slot]!.test!.test(char)) {
            slots[slot] = char;
            pos = slot + 1;
        }
    }
    return slots;
}

/**
 * Moves the characters in the slots from `from` onwards one slot to the right,
 * as far as each still fits where it lands; the one pushed off the end is lost.
 * Returns null when a character would land in a slot that refuses it.
 */
function shiftRight(tokens: readonly MaskToken[], slots: MaskSlots, from: number): MaskSlots | null {
    const next = [...slots];
    let i = nextSlot(tokens, from);
    let carry = next[i] ?? null;
    next[i] = null;
    for (i = nextSlot(tokens, i + 1); carry !== null && i < tokens.length; i = nextSlot(tokens, i + 1)) {
        if (!tokens[i]!.test!.test(carry)) return null;
        const displaced = next[i] ?? null;
        next[i] = carry;
        carry = displaced;
    }
    return next;
}

/** Pulls the characters after `to` left to fill the slots from `from`, as far as each still fits. */
function shiftLeft(tokens: readonly MaskToken[], slots: MaskSlots, from: number, to: number): MaskSlots {
    const next = [...slots];
    for (let i = from; i < to; i++) if (isSlot(tokens[i])) next[i] = null;
    let write = nextSlot(tokens, from);
    let read = nextSlot(tokens, to);
    while (write < tokens.length) {
        if (read < tokens.length && next[read] && tokens[write]!.test!.test(next[read]!)) {
            next[write] = next[read]!;
            next[read] = null;
            read = nextSlot(tokens, read + 1);
        } else {
            break;
        }
        write = nextSlot(tokens, write + 1);
    }
    return next;
}

/**
 * Types `text` with the selection at `start`–`end`: the selection is cleared,
 * then each character goes into the next slot that takes it, pushing what was
 * there to the right. A literal typed where the pattern has one steps over it.
 */
export function maskInsert(tokens: readonly MaskToken[], slots: MaskSlots, start: number, end: number, text: string): MaskEdit {
    let next = end > start ? shiftLeft(tokens, slots, start, end) : [...slots];
    let pos = start;
    for (const char of text) {
        const literalAt = tokens[pos]?.literal;
        if (literalAt !== undefined && literalAt === char) {
            pos++;
            continue;
        }
        const slot = nextSlot(tokens, pos);
        if (slot >= tokens.length) break;
        if (!tokens[slot]!.test!.test(char)) continue;
        const shifted = next[slot] ? shiftRight(tokens, next, slot) : next;
        if (!shifted) continue;
        shifted[slot] = char;
        next = shifted;
        pos = slot + 1;
    }
    return { slots: next, caret: nextSlot(tokens, pos) };
}

/**
 * Deletes the selection, or with none the slot before the caret (Backspace) or
 * after it (Delete), pulling the characters that follow to the left.
 */
export function maskDelete(tokens: readonly MaskToken[], slots: MaskSlots, start: number, end: number, direction: 'backward' | 'forward'): MaskEdit {
    if (end > start) return { slots: shiftLeft(tokens, slots, start, end), caret: start };
    if (direction === 'backward') {
        const slot = previousSlot(tokens, start);
        if (slot < 0) return { slots: [...slots], caret: nextSlot(tokens, 0) };
        return { slots: shiftLeft(tokens, slots, slot, slot + 1), caret: slot };
    }
    const slot = nextSlot(tokens, start);
    if (slot >= tokens.length) return { slots: [...slots], caret: start };
    return { slots: shiftLeft(tokens, slots, slot, slot + 1), caret: slot };
}

/** Where the caret belongs when the box takes focus: on the first empty slot, or at the end. */
export function maskCaret(tokens: readonly MaskToken[], slots: MaskSlots): number {
    for (let i = 0; i < tokens.length; i++) if (isSlot(tokens[i]) && !slots[i]) return i;
    return tokens.length;
}

// ---- patterns that change as the value grows --------------------------------

/**
 * A fixed pattern, a list of them, or a function that picks one. A list or a
 * function lets one box take values of more than one shape: a CPF that
 * becomes a CNPJ once the eleven digits are past, a phone number with a ninth
 * digit.
 */
export type MaskPattern = string | readonly string[] | ((raw: string) => string);

/**
 * The pattern for the characters typed so far (`raw`, without literals). A
 * string is itself; a function is asked; a list gives its first pattern with
 * a slot for every character, each one accepted where it lands, or its last
 * when none has room.
 */
export function pickMask(mask: MaskPattern, raw: string, definitions: MaskDefinitions = defaultMaskDefinitions): string {
    if (typeof mask === 'string') return mask;
    if (typeof mask === 'function') return mask(raw);
    const chars = [...raw];
    for (const pattern of mask) {
        const tests = parseMask(pattern, definitions).filter(isSlot);
        if (tests.length >= chars.length && chars.every((char, i) => tests[i]!.test!.test(char))) return pattern;
    }
    return mask[mask.length - 1] ?? '';
}

/** Puts `raw` into the slots in order, with no gaps; a character its slot refuses is dropped. */
export function fillMask(tokens: readonly MaskToken[], raw: string): MaskSlots {
    const slots = emptyMask(tokens);
    let slot = nextSlot(tokens, 0);
    for (const char of raw) {
        if (slot >= tokens.length) break;
        if (!tokens[slot]!.test!.test(char)) continue;
        slots[slot] = char;
        slot = nextSlot(tokens, slot + 1);
    }
    return slots;
}

/** How many slots lie before a text position. */
function slotsBefore(tokens: readonly MaskToken[], position: number): number {
    let count = 0;
    for (let i = 0; i < Math.min(position, tokens.length); i++) if (isSlot(tokens[i])) count++;
    return count;
}

/** The text position just past the `count`th slot, on the next slot when there is one. */
function caretAfter(tokens: readonly MaskToken[], count: number): number {
    if (count <= 0) return nextSlot(tokens, 0);
    let seen = 0;
    for (let i = 0; i < tokens.length; i++) {
        if (isSlot(tokens[i]) && ++seen === count) return nextSlot(tokens, i + 1);
    }
    return tokens.length;
}

/**
 * Lays `raw` into the pattern it picks. A character that pattern refuses is
 * dropped, and what is left may pick another, so the choice is made again on
 * what was kept.
 */
function settleMask(mask: MaskPattern, raw: string, definitions: MaskDefinitions): { pattern: string; tokens: MaskToken[]; slots: MaskSlots } {
    let pattern = pickMask(mask, raw, definitions);
    let tokens = parseMask(pattern, definitions);
    let slots = fillMask(tokens, raw);
    const kept = unmaskValue(tokens, slots);
    if (kept !== raw) {
        const again = pickMask(mask, kept, definitions);
        if (again !== pattern) {
            pattern = again;
            tokens = parseMask(pattern, definitions);
            slots = fillMask(tokens, kept);
        }
    }
    return { pattern, tokens, slots };
}

export interface MaskPatternEdit extends MaskEdit {
    /** The pattern the edited value is shown in. */
    pattern: string;
    tokens: MaskToken[];
}

/**
 * An edit for a pattern that may change with it. It works on the typed
 * characters rather than on the slots: the selection is mapped to them, the
 * text goes in or the character comes out, and the result picks its pattern
 * and is laid into it. A character typed into a full pattern is therefore not
 * lost when a longer one in the list has room for it.
 */
export function maskPatternEdit(
    mask: MaskPattern,
    tokens: readonly MaskToken[],
    slots: MaskSlots,
    start: number,
    end: number,
    change: { text: string } | { remove: 'backward' | 'forward' },
    definitions: MaskDefinitions = defaultMaskDefinitions
): MaskPatternEdit {
    const raw = unmaskValue(tokens, slots);
    let from = Math.min(slotsBefore(tokens, start), raw.length);
    let to = Math.max(from, Math.min(slotsBefore(tokens, end), raw.length));
    const text = 'text' in change ? change.text : '';
    if ('remove' in change && from === to) {
        if (change.remove === 'backward') from = Math.max(0, from - 1);
        else to = Math.min(raw.length, to + 1);
    }
    const kept = raw.length - (to - from);
    const next = raw.slice(0, from) + text + raw.slice(to);
    const { pattern, tokens: nextTokens, slots: nextSlots } = settleMask(mask, next, definitions);
    const accepted = Math.max(0, Math.min(text.length, unmaskValue(nextTokens, nextSlots).length - kept));
    return { pattern, tokens: nextTokens, slots: nextSlots, caret: caretAfter(nextTokens, from + accepted) };
}

/**
 * Reads a value set from outside — masked or raw — into the pattern it
 * belongs in.
 */
export function parseMaskPattern(mask: MaskPattern, text: string | null | undefined, definitions: MaskDefinitions = defaultMaskDefinitions, slotChar = '_'): MaskPatternEdit {
    // A first reading in the pattern the text's characters suggest, then a
    // second in the one its slots pick, which may be another.
    const accepted = [...(text ?? '')].filter((char) => Object.values(definitions).some((test) => test.test(char))).join('');
    const first = parseMask(pickMask(mask, accepted, definitions), definitions);
    const { pattern, tokens, slots } = settleMask(mask, unmaskValue(first, parseMaskText(first, text, slotChar)), definitions);
    return { pattern, tokens, slots, caret: maskCaret(tokens, slots) };
}

// ---- a mask as one value -----------------------------------------------------

/**
 * A mask with everything it needs, so that it can be defined once and handed
 * to any field that takes a mask: the same object gives the same box in each.
 */
export interface MaskOptions {
    pattern: MaskPattern;
    /** The value is only the typed characters, without the literals. */
    unmask?: boolean;
    /** What an empty slot shows: one character, or a string as long as the pattern. Defaults to `_`. */
    slotChar?: string;
    /** Clear an unfinished value when the box loses focus. Defaults to true. */
    autoClear?: boolean;
    /** Extra slot characters, each with the characters it accepts. */
    definitions?: MaskDefinitions;
    /** Letters are turned to this case as they are typed. */
    case?: 'upper' | 'lower';
}

/** What a `mask` prop takes: a pattern, a list, a function, or the whole of a mask. */
export type MaskProp = MaskPattern | MaskOptions;

export interface ResolvedMask {
    pattern: MaskPattern;
    unmask: boolean;
    slotChar: string;
    autoClear: boolean;
    /** The default slot characters with the mask's own over them. */
    definitions: MaskDefinitions;
    case: 'upper' | 'lower' | undefined;
}

const isMaskOptions = (mask: MaskProp): mask is MaskOptions => typeof mask === 'object' && mask !== null && !Array.isArray(mask);

/**
 * A mask prop with the field's own settings applied. A setting given on the
 * field wins over the same one in the mask, so a shared mask can be adjusted
 * where it is used; `undefined` on the field leaves the mask's.
 */
export function resolveMask(mask: MaskProp, field: Omit<MaskOptions, 'pattern'> = {}): ResolvedMask {
    const own: Partial<MaskOptions> = isMaskOptions(mask) ? mask : { pattern: mask };
    const pick = <K extends keyof MaskOptions>(key: K): MaskOptions[K] => (field[key as Exclude<K, 'pattern'>] ?? own[key]) as MaskOptions[K];
    return {
        pattern: own.pattern ?? '',
        unmask: pick('unmask') ?? false,
        slotChar: pick('slotChar') ?? '_',
        autoClear: pick('autoClear') ?? true,
        definitions: { ...defaultMaskDefinitions, ...own.definitions, ...field.definitions },
        case: pick('case')
    };
}

/** Typed text in the mask's case. */
export function maskCase(text: string, letterCase: 'upper' | 'lower' | undefined): string {
    if (letterCase === 'upper') return text.toUpperCase();
    if (letterCase === 'lower') return text.toLowerCase();
    return text;
}

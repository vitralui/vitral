/**
 * A one-time code typed into one box per character. The value is the boxes
 * joined; these decide what a keystroke or a paste does to them.
 */

/** Whether a character may go into a box: a digit when `integerOnly`, anything visible otherwise. */
export function isOtpChar(char: string, integerOnly = false): boolean {
    if (char.length !== 1) return false;
    return integerOnly ? /[0-9]/.test(char) : /\S/.test(char);
}

/** The value split into `length` boxes, padded with empty strings. */
export function otpBoxes(value: string | null | undefined, length: number): string[] {
    const chars = [...(value ?? '')];
    return Array.from({ length }, (_, i) => chars[i] ?? '');
}

export interface OtpEdit {
    boxes: string[];
    /** The box focus moves to. */
    focus: number;
}

/**
 * Text entered into box `index`, one typed character or a whole pasted code,
 * spread across that box and the ones after it. Characters a box refuses are
 * dropped; focus moves to the box after the last one filled.
 */
export function otpFill(boxes: readonly string[], index: number, text: string, integerOnly = false): OtpEdit {
    const next = [...boxes];
    let at = index;
    for (const char of text) {
        if (at >= next.length) break;
        if (!isOtpChar(char, integerOnly)) continue;
        next[at++] = char;
    }
    return { boxes: next, focus: Math.min(at, next.length - 1) };
}

/** Backspace in box `index`: clears it, or when it is already empty the one before, where focus goes. */
export function otpBackspace(boxes: readonly string[], index: number): OtpEdit {
    const next = [...boxes];
    if (next[index]) {
        next[index] = '';
        return { boxes: next, focus: index };
    }
    const previous = Math.max(0, index - 1);
    next[previous] = '';
    return { boxes: next, focus: previous };
}

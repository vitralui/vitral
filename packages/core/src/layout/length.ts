/**
 * A length as CSS: a number is pixels, as a desktop layout length is; a string is
 * any CSS length (`'1rem'`, `'2ch'`, `'var(--gap)'`) and passes through. Empty
 * and non-finite values give `undefined`, so a caller can fall back to a token.
 */
export function toCssLength(value: number | string | null | undefined): string | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'number') return Number.isFinite(value) ? `${value}px` : undefined;
    const text = value.trim();
    if (!text) return undefined;
    // A bare number written as a string (`spacing="12"`) is pixels too.
    return /^-?\d*\.?\d+$/.test(text) ? `${Number(text)}px` : text;
}

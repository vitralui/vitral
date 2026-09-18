/**
 * What a file picker checks before it queues a file, and how it writes a
 * size — no DOM involved beyond the `File`'s name, type and size.
 */
export interface FileLike {
    name: string;
    type: string;
    size: number;
}

export interface FileRules {
    /** The `accept` attribute's syntax: `image/*`, `.pdf`, `application/json`, comma-separated. */
    accept?: string;
    /** In bytes. */
    maxFileSize?: number;
}

export type FileProblem = 'type' | 'size';

/** Whether a file matches an `accept` list, as the browser's picker would. An empty list accepts anything. */
export function matchesAccept(file: FileLike, accept?: string | null): boolean {
    const rules = (accept ?? '')
        .split(',')
        .map((r) => r.trim().toLowerCase())
        .filter(Boolean);
    if (rules.length === 0) return true;
    const name = file.name.toLowerCase();
    const type = (file.type || '').toLowerCase();
    return rules.some((rule) => {
        if (rule.startsWith('.')) return name.endsWith(rule);
        if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
        return type === rule;
    });
}

/** The first rule a file breaks, or null when it may be queued. */
export function validateFile(file: FileLike, rules: FileRules = {}): FileProblem | null {
    if (!matchesAccept(file, rules.accept)) return 'type';
    if (rules.maxFileSize !== undefined && rules.maxFileSize !== null && file.size > rules.maxFileSize) return 'size';
    return null;
}

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'] as const;

/**
 * A size in the largest unit that keeps it at or above one — "532 bytes",
 * "1.4 MB" — written by `Intl` in the reader's language. Decimal (1000-based)
 * units, as file managers show them.
 */
export function formatFileSize(bytes: number, locale?: string): string {
    const value = Math.max(0, Number.isFinite(bytes) ? bytes : 0);
    let unit = 0;
    let amount = value;
    while (amount >= 1000 && unit < UNITS.length - 1) {
        amount /= 1000;
        unit++;
    }
    const format = new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: UNITS[unit],
        unitDisplay: unit === 0 ? 'long' : 'short',
        maximumFractionDigits: unit === 0 || amount >= 100 ? 0 : 1
    });
    return format.format(amount);
}

/** The files that still fit under `limit`, given how many are already there; the rest are refused. */
export function takeWithinLimit<T>(files: readonly T[], existing: number, limit?: number | null): { accepted: T[]; refused: T[] } {
    if (limit === undefined || limit === null) return { accepted: [...files], refused: [] };
    const room = Math.max(0, limit - existing);
    return { accepted: files.slice(0, room), refused: files.slice(room) };
}

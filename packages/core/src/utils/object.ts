// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Dict = Record<string, any>;

/** A plain object: not an array, a date, a regular expression or null. */
export function isObject(value: unknown): value is Dict {
    return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof RegExp);
}

export function isEmpty(value: unknown): boolean {
    if (value === null || value === undefined || value === '') return true;
    if (Array.isArray(value)) return value.length === 0;
    if (value instanceof Date) return false;
    if (isObject(value)) return Object.keys(value).length === 0;
    return false;
}

/**
 * Merges its arguments left to right into a fresh object. Plain objects recurse;
 * anything else, arrays included, replaces what was there. An `undefined` in a
 * later source leaves the earlier value alone, so a partial override never
 * erases a key by omission.
 */
export function deepMerge<T extends Dict = Dict>(...sources: (Dict | null | undefined)[]): T {
    const out: Dict = {};
    for (const source of sources) {
        if (!source) continue;
        for (const key of Object.keys(source)) {
            const next = source[key];
            if (next === undefined) continue;
            const prev = out[key];
            out[key] = isObject(next) ? deepMerge(isObject(prev) ? prev : {}, next) : next;
        }
    }
    return out as T;
}

/** A value, or the result of calling it when it is a function. */
export function resolve<T>(value: T | ((...args: never[]) => T), ...args: unknown[]): T {
    return typeof value === 'function' ? (value as (...a: unknown[]) => T)(...args) : value;
}

export type FieldAccessor<T = unknown> = string | ((item: T) => unknown);

/** Reads `field` off `data`; a dotted path walks nested objects, a function is called. */
export function getField(data: unknown, field: FieldAccessor | undefined | null): unknown {
    if (data == null || field == null) return undefined;
    if (typeof field === 'function') return field(data);
    if (!field.includes('.')) return (data as Dict)[field];
    let current: unknown = data;
    for (const part of field.split('.')) {
        if (current == null) return undefined;
        current = (current as Dict)[part];
    }
    return current;
}

/** Structural equality; with a `dataKey`, only that field is compared. */
export function equals(a: unknown, b: unknown, dataKey?: string): boolean {
    if (dataKey) return deepEquals(getField(a, dataKey), getField(b, dataKey));
    return deepEquals(a, b);
}

function deepEquals(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (a && b && typeof a === 'object' && typeof b === 'object') {
        if (Array.isArray(a) !== Array.isArray(b)) return false;
        if (Array.isArray(a)) {
            const other = b as unknown[];
            return a.length === other.length && a.every((value, i) => deepEquals(value, other[i]));
        }
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        return keysA.length === keysB.length && keysA.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEquals((a as Dict)[k], (b as Dict)[k]));
    }
    return typeof a === 'number' && typeof b === 'number' && Number.isNaN(a) && Number.isNaN(b);
}

export function indexOfValue(list: readonly unknown[] | null | undefined, value: unknown, dataKey?: string): number {
    if (!list) return -1;
    return list.findIndex((item) => equals(item, value, dataKey));
}

/** `paddingX` → `padding-x`, `borderRadiusMD` → `border-radius-md`. */
export function toKebab(value: string): string {
    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
        .toLowerCase();
}

// Paths name a value inside the form's values: `email`, `address.city`,
// `items.0.title`, and, as schema libraries write them, `items[0].title`.
// Every path is normalised to the dotted form before it is used as a key, so
// errors reported by a resolver and fields registered by a view meet.

export type PathSegment = string | number;

/** The segments of a path: `'items[0].title'` → `['items', 0, 'title']`. */
export function parsePath(path: string | readonly PathSegment[]): PathSegment[] {
    if (Array.isArray(path)) return path.map((segment) => (typeof segment === 'string' && /^\d+$/.test(segment) ? Number(segment) : segment));
    const text = path as string;
    if (text === '') return [];
    const out: PathSegment[] = [];
    // `a[0]` and `a['b']` are written `a.0` and `a.b`; a key cannot itself hold a dot.
    for (const raw of text.replace(/\[\s*(?:'([^']*)'|"([^"]*)"|([^\]]*))\s*\]/g, (_m, a, b, c) => `.${a ?? b ?? c}`).split('.')) {
        if (raw === '') continue;
        out.push(/^\d+$/.test(raw) ? Number(raw) : raw);
    }
    return out;
}

/** The dotted form of a path: `'items[0].title'` → `'items.0.title'`. */
export function toPath(path: string | readonly (PathSegment | { key: PropertyKey } | symbol)[]): string {
    if (typeof path === 'string') return parsePath(path).join('.');
    return path
        .map((segment) => (typeof segment === 'object' && segment !== null ? (segment as { key: PropertyKey }).key : segment))
        .map((segment) => String(typeof segment === 'symbol' ? (segment.description ?? '') : segment))
        .join('.');
}

/** Joins path pieces: `joinPath('items', 2, 'title')` → `'items.2.title'`. */
export function joinPath(...parts: (PathSegment | undefined | null)[]): string {
    return parts
        .filter((part) => part !== undefined && part !== null && part !== '')
        .map((part) => toPath(String(part)))
        .join('.');
}

/** Whether `path` is `parent` or lies inside it (`items.0.title` inside `items`). */
export function isPathWithin(path: string, parent: string): boolean {
    return parent === '' || path === parent || path.startsWith(`${parent}.`);
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== 'object') return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

/** The value at `path`, or undefined when anything along the way is missing. */
export function getIn(source: unknown, path: string | readonly PathSegment[]): unknown {
    let current: unknown = source;
    for (const segment of parsePath(path)) {
        if (current === null || current === undefined) return undefined;
        current = (current as Record<PropertyKey, unknown>)[segment];
    }
    return current;
}

/**
 * A copy of `source` with `value` at `path`. Only the containers along the
 * path are copied, everything else is shared, and a missing container is
 * created as an array when the next segment is an index, an object otherwise.
 */
export function setIn<T>(source: T, path: string | readonly PathSegment[], value: unknown): T {
    const segments = parsePath(path);
    if (segments.length === 0) return value as T;
    const [head, ...rest] = segments as [PathSegment, ...PathSegment[]];
    const container: unknown = source ?? (typeof head === 'number' ? [] : {});
    const copy = (Array.isArray(container) ? [...container] : { ...(container as object) }) as Record<PropertyKey, unknown>;
    const child = (container as Record<PropertyKey, unknown>)[head];
    copy[head] = rest.length ? setIn(child ?? (typeof rest[0] === 'number' ? [] : {}), rest, value) : value;
    return copy as T;
}

/** A copy of `source` without the key at `path` (an array element is spliced out). */
export function deleteIn<T>(source: T, path: string | readonly PathSegment[]): T {
    const segments = parsePath(path);
    if (segments.length === 0 || source === null || source === undefined) return source;
    const parentPath = segments.slice(0, -1);
    const key = segments[segments.length - 1]!;
    const parent = getIn(source, parentPath);
    if (parent === null || typeof parent !== 'object') return source;
    let next: unknown;
    if (Array.isArray(parent)) {
        next = parent.filter((_, i) => i !== Number(key));
    } else {
        const { [key as string]: _removed, ...rest } = parent as Record<string, unknown>;
        next = rest;
    }
    return parentPath.length ? setIn(source, parentPath, next) : (next as T);
}

/** Structural equality over plain objects, arrays, dates and primitives. */
export function isEqual(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) return true;
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, i) => isEqual(item, b[i]));
    if (isPlainObject(a) && isPlainObject(b)) {
        const keys = Object.keys(a);
        if (keys.length !== Object.keys(b).length) return false;
        return keys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && isEqual(a[key], b[key]));
    }
    return false;
}

/**
 * A deep copy of plain objects, arrays and dates. Anything else, a `File` or a
 * class instance, is kept by reference, as it cannot be copied faithfully.
 */
export function cloneValue<T>(value: T): T {
    if (Array.isArray(value)) return value.map((item) => cloneValue(item)) as T;
    if (value instanceof Date) return new Date(value.getTime()) as T;
    if (isPlainObject(value)) {
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(value)) out[key] = cloneValue(value[key]);
        return out as T;
    }
    return value;
}

/** An empty value, as far as `required` is concerned: nothing, blank text, an empty list. */
export function isEmptyValue(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'number') return Number.isNaN(value);
    if (value instanceof Date) return Number.isNaN(value.getTime());
    return false;
}

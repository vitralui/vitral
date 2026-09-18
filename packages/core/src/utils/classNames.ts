export type ClassValue = string | number | null | undefined | false | ClassValue[] | Record<string, unknown>;

/**
 * Flattens strings, arrays and `{ className: condition }` records into one class
 * string. Every framework adapter feeds class maps through here, so a component's
 * classes read the same in Vue, React and Angular.
 */
export function cn(...values: ClassValue[]): string {
    const out: string[] = [];
    const walk = (value: ClassValue): void => {
        if (!value && value !== 0) return;
        if (typeof value === 'string' || typeof value === 'number') {
            out.push(String(value));
        } else if (Array.isArray(value)) {
            value.forEach(walk);
        } else {
            for (const key of Object.keys(value)) if (value[key]) out.push(key);
        }
    };
    values.forEach(walk);
    return out.join(' ');
}

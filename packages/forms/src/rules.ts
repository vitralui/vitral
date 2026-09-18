import { fillMessage, type FormMessages } from './messages';
import { getIn, isEmptyValue, isEqual } from './path';

/**
 * What a rule returns: a message when the value is wrong; `undefined`, `null`,
 * `true` or `''` when it is fine; `false` for "wrong" with the generic
 * `invalid` message.
 */
export type RuleResult = string | boolean | null | undefined | void;

export interface RuleContext<Values = Record<string, unknown>> {
    /** The dotted path of the field being validated. */
    path: string;
    /** Every value in the form, as it is now. */
    values: Values;
    /** The messages in use — the locale's, when a view layer passes them. */
    messages: FormMessages;
    /** Aborted when a newer validation of this field starts; hand it to `fetch`. */
    signal: AbortSignal;
    /** Reads another value: `get('password')`. */
    get(path: string): unknown;
    /** A field's human name, for messages that mention another field. */
    labelOf(path: string): string;
}

/** A rule: a function of the value. Async rules return a promise. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Rule<T = any, Values = any> {
    (value: T, context: RuleContext<Values>): RuleResult | Promise<RuleResult>;
    /** Other paths this rule reads; when one of them changes, the field is validated again. */
    deps?: readonly string[];
    /** Marks the `required` rule, so a view can set `aria-required`. */
    isRequired?: boolean;
}

/** A message written by hand: text (with the rule's placeholders) or a function of the context. */
export type RuleMessage = string | ((context: RuleContext & { params: Record<string, unknown> }) => string);

function message(custom: RuleMessage | undefined, fallback: keyof FormMessages, context: RuleContext, params: Record<string, unknown> = {}): string {
    if (typeof custom === 'function') return custom({ ...context, params });
    return fillMessage(custom ?? context.messages[fallback], params);
}

function lengthOf(value: unknown): number | undefined {
    if (typeof value === 'string' || Array.isArray(value)) return value.length;
    return undefined;
}

function comparable(value: unknown): number | undefined {
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number') return Number.isNaN(value) ? undefined : value;
    if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
    return undefined;
}

function withMeta<T>(rule: Rule<T>, meta: { deps?: readonly string[]; isRequired?: boolean }): Rule<T> {
    return Object.assign(rule, meta);
}

/** A value has to be given: not empty text (spaces do not count), not an empty list, not `false` when `acceptFalse` is off. */
export function required(msg?: RuleMessage, options: { acceptFalse?: boolean } = {}): Rule {
    return withMeta((value, ctx) => {
        const empty = isEmptyValue(value) || (value === false && !options.acceptFalse);
        return empty ? message(msg, 'required', ctx) : undefined;
    }, { isRequired: true });
}

/**
 * Text of at least `min` characters, or a list of at least `min` items. Empty
 * text passes — pair it with `required` — but an empty list is a list of none.
 */
export function minLength(min: number, msg?: RuleMessage): Rule {
    return (value, ctx) => {
        if (!Array.isArray(value) && isEmptyValue(value)) return undefined;
        const length = lengthOf(value);
        if (length === undefined || length >= min) return undefined;
        return message(msg, Array.isArray(value) ? 'minItems' : 'minLength', ctx, { min, length });
    };
}

/** Text of at most `max` characters, or a list of at most `max` items. */
export function maxLength(max: number, msg?: RuleMessage): Rule {
    return (value, ctx) => {
        const length = lengthOf(value);
        if (length === undefined || length <= max) return undefined;
        return message(msg, Array.isArray(value) ? 'maxItems' : 'maxLength', ctx, { max, length });
    };
}

/** A number (or numeric text) or a date no smaller than `min`. */
export function min(bound: number | Date, msg?: RuleMessage): Rule {
    return (value, ctx) => {
        if (isEmptyValue(value)) return undefined;
        const n = comparable(value);
        const limit = comparable(bound)!;
        if (n === undefined) return message(undefined, 'invalid', ctx);
        return n < limit ? message(msg, 'min', ctx, { min: bound }) : undefined;
    };
}

/** A number (or numeric text) or a date no larger than `max`. */
export function max(bound: number | Date, msg?: RuleMessage): Rule {
    return (value, ctx) => {
        if (isEmptyValue(value)) return undefined;
        const n = comparable(value);
        const limit = comparable(bound)!;
        if (n === undefined) return message(undefined, 'invalid', ctx);
        return n > limit ? message(msg, 'max', ctx, { max: bound }) : undefined;
    };
}

/** Text matching a regular expression (tested against the whole value as given). */
export function pattern(regexp: RegExp, msg?: RuleMessage): Rule {
    return (value, ctx) => {
        if (isEmptyValue(value)) return undefined;
        regexp.lastIndex = 0;
        return regexp.test(String(value)) ? undefined : message(msg, 'pattern', ctx);
    };
}

// The shape browsers check `<input type="email">` against (WHATWG), with a dot required in the domain.
const EMAIL = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/** An email address: `name@example.com`. */
export function email(msg?: RuleMessage): Rule {
    return (value, ctx) => {
        if (isEmptyValue(value)) return undefined;
        return EMAIL.test(String(value).trim()) ? undefined : message(msg, 'email', ctx);
    };
}

/** An absolute web address; `protocols` defaults to http and https. */
export function url(msg?: RuleMessage, options: { protocols?: readonly string[] } = {}): Rule {
    const protocols = options.protocols ?? ['http:', 'https:'];
    return (value, ctx) => {
        if (isEmptyValue(value)) return undefined;
        try {
            const parsed = new URL(String(value).trim());
            return protocols.includes(parsed.protocol) && parsed.hostname ? undefined : message(msg, 'url', ctx);
        } catch {
            return message(msg, 'url', ctx);
        }
    };
}

/** The same value as another field — a password confirmation. Validated again when that field changes. */
export function equalsField(path: string, msg?: RuleMessage): Rule {
    return withMeta(
        (value, ctx) => {
            const other = getIn(ctx.values, path);
            if (isEmptyValue(value) && isEmptyValue(other)) return undefined;
            return isEqual(value, other) ? undefined : message(msg, 'equals', ctx, { field: ctx.labelOf(path) });
        },
        { deps: [path] }
    );
}

/**
 * A rule written as a predicate: `custom((v) => v !== 'admin', 'That name is taken.')`.
 * The function may return a boolean, a message, or a promise of either.
 */
export function custom<T = unknown>(test: (value: T, context: RuleContext) => RuleResult | Promise<RuleResult>, msg?: RuleMessage, options: { deps?: readonly string[] } = {}): Rule<T> {
    const rule: Rule<T> = (value, ctx) => {
        const settle = (result: RuleResult): RuleResult => {
            if (result === false) return message(msg, 'invalid', ctx);
            if (typeof result === 'string' && result !== '') return result;
            return undefined;
        };
        const result = test(value, ctx);
        return result instanceof Promise ? result.then(settle) : settle(result);
    };
    return withMeta(rule, { deps: options.deps });
}

/** The built-in rules, as one object: `rules.required()`, `rules.email()`. */
export const rules = { required, minLength, maxLength, min, max, pattern, email, url, equalsField, custom };

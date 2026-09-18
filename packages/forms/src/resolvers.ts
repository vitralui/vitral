import { isPlainObject, toPath, type PathSegment } from './path';

/** Errors by dotted path; each path may carry several messages, the first is the one shown. */
export type FormErrors = Record<string, string[]>;

/** What a resolver hands back: the errors, plus the values to submit when the schema transforms its input. */
export interface ResolverResult<Values = unknown> {
    errors: FormErrors;
    values?: Values;
}

export interface ResolverContext {
    /** Aborted when a newer validation replaces this one. */
    signal: AbortSignal;
    /** The paths being validated; all of them when absent. A resolver may use it to skip work. */
    fields?: readonly string[];
}

/**
 * Validates the whole form in one call. Resolvers are how a schema library
 * plugs in: the adapters below are written against the smallest shape each
 * library exposes, so `@vitral/forms` depends on none of them.
 */
export type Resolver<Values = any> = (values: Values, context: ResolverContext) => ResolverResult<Values> | Promise<ResolverResult<Values>>;

/** Errors as a resolver or a server may write them: flat by path, or nested like the values; a message or a list of them. */
export type ErrorsInput = { [key: string]: string | readonly string[] | null | undefined | false | ErrorsInput | readonly ErrorsInput[] };

/** Flattens {@link ErrorsInput} into {@link FormErrors}: `{ address: { city: 'x' } }` → `{ 'address.city': ['x'] }`. */
export function normalizeErrors(input: ErrorsInput | null | undefined, prefix = ''): FormErrors {
    const out: FormErrors = {};
    if (!input) return out;
    const add = (path: string, messages: string[]) => {
        if (!messages.length) return;
        (out[path] ??= []).push(...messages);
    };
    for (const [key, value] of Object.entries(input)) {
        const path = toPath(prefix ? `${prefix}.${key}` : key);
        if (value === null || value === undefined || value === false || value === '') continue;
        if (typeof value === 'string') add(path, [value]);
        else if (Array.isArray(value)) {
            if (value.every((item) => typeof item === 'string')) add(path, (value as string[]).filter(Boolean));
            else value.forEach((item, i) => {
                if (typeof item === 'string') add(path, [item]);
                else if (item) Object.assign(out, mergeErrors(out, normalizeErrors(item as ErrorsInput, `${path}.${i}`)));
            });
        } else if (isPlainObject(value)) Object.assign(out, mergeErrors(out, normalizeErrors(value as ErrorsInput, path)));
    }
    return out;
}

export function mergeErrors(...sources: FormErrors[]): FormErrors {
    const out: FormErrors = {};
    for (const source of sources) for (const [path, messages] of Object.entries(source)) if (messages.length) out[path] = [...(out[path] ?? []), ...messages.filter((m) => !(out[path] ?? []).includes(m))];
    return out;
}

/** An issue as most libraries report it: a message and where it happened. */
interface IssueLike {
    message: string;
    path?: readonly (PathSegment | symbol | { key: PropertyKey })[] | string;
}

function fromIssues(issues: readonly IssueLike[] | undefined): FormErrors {
    const out: FormErrors = {};
    for (const issue of issues ?? []) {
        const path = issue.path === undefined ? '' : toPath(issue.path as string);
        (out[path] ??= []).push(issue.message);
    }
    return out;
}

// ---------------------------------------------------------------- functions

/**
 * A resolver from a plain function of the values: return errors by path (or
 * nested like the values), or a promise of them. Cross-field checks fit here.
 *
 * ```ts
 * functionResolver((v) => ({ confirm: v.password !== v.confirm ? 'Passwords differ.' : undefined }))
 * ```
 */
export function functionResolver<Values = any>(validate: (values: Values, context: ResolverContext) => ErrorsInput | null | undefined | void | Promise<ErrorsInput | null | undefined | void>): Resolver<Values> {
    return (values, context) => {
        const result = validate(values, context);
        return result instanceof Promise ? result.then((errors) => ({ errors: normalizeErrors(errors || undefined) })) : { errors: normalizeErrors(result || undefined) };
    };
}

// ---------------------------------------------------------------- zod

/** The part of a Zod schema the adapter uses: `safeParse` (and `safeParseAsync` when present, for async refinements). */
export interface ZodSchemaLike<Output = unknown> {
    safeParse(value: unknown): ZodResultLike<Output>;
    safeParseAsync?(value: unknown): Promise<ZodResultLike<Output>>;
}

export type ZodResultLike<Output> = { success: true; data: Output } | { success: false; error: { issues: readonly IssueLike[] } };

/** Validates with a Zod schema (v3 or v4); transforms reach the submitted values. */
export function zodResolver<Output = any>(schema: ZodSchemaLike<Output>, options: { async?: boolean } = {}): Resolver {
    return async (values) => {
        const result = options.async === false || !schema.safeParseAsync ? schema.safeParse(values) : await schema.safeParseAsync(values);
        return result.success ? { errors: {}, values: result.data } : { errors: fromIssues(result.error.issues) };
    };
}

// ---------------------------------------------------------------- yup

/** The part of a Yup schema the adapter uses. */
export interface YupSchemaLike<Output = unknown> {
    validate(value: unknown, options?: { abortEarly?: boolean; [key: string]: unknown }): Promise<Output>;
}

interface YupErrorLike {
    name?: string;
    message: string;
    path?: string;
    inner?: readonly { message: string; path?: string }[];
}

/** Validates with a Yup schema, collecting every error (`abortEarly: false`); casts reach the submitted values. */
export function yupResolver<Output = any>(schema: YupSchemaLike<Output>, options: Record<string, unknown> = {}): Resolver {
    return async (values) => {
        try {
            const output = await schema.validate(values, { abortEarly: false, ...options });
            return { errors: {}, values: output };
        } catch (thrown) {
            const error = thrown as YupErrorLike;
            if (!error || typeof error !== 'object' || (!('inner' in error) && error.name !== 'ValidationError')) throw thrown;
            const list = error.inner?.length ? error.inner : [{ message: error.message, path: error.path }];
            return { errors: fromIssues(list.map((item) => ({ message: item.message, path: item.path ?? '' }))) };
        }
    };
}

// ---------------------------------------------------------------- standard schema

/**
 * The Standard Schema interface (`~standard`), which Valibot (v1), Zod
 * (3.24 and later), ArkType and others implement.
 */
export interface StandardSchemaLike<Output = unknown> {
    readonly '~standard': {
        validate(value: unknown): StandardResultLike<Output> | Promise<StandardResultLike<Output>>;
    };
}

export type StandardResultLike<Output> = { value: Output; issues?: undefined } | { issues: readonly IssueLike[] };

/** Validates with any schema that implements Standard Schema. */
export function standardSchemaResolver<Output = any>(schema: StandardSchemaLike<Output>): Resolver {
    return async (values) => {
        const result = await schema['~standard'].validate(values);
        return result.issues ? { errors: fromIssues(result.issues) } : { errors: {}, values: (result as { value: Output }).value };
    };
}

// ---------------------------------------------------------------- valibot

/** What Valibot's `safeParse(schema, input)` returns. */
export interface ValibotResultLike<Output = unknown> {
    success: boolean;
    output?: Output;
    issues?: readonly { message: string; path?: readonly { key: PropertyKey }[] }[];
}

export interface ValibotOptions {
    /**
     * Valibot's `safeParse` (or `safeParseAsync`), for a schema that does not
     * implement Standard Schema: `valibotResolver(schema, { safeParse: v.safeParseAsync })`.
     */
    safeParse?: (schema: never, input: unknown) => ValibotResultLike | Promise<ValibotResultLike>;
}

/** Validates with a Valibot schema, through Standard Schema or through the `safeParse` you pass. */
export function valibotResolver<Output = any>(schema: object, options: ValibotOptions = {}): Resolver {
    if (options.safeParse) {
        const parse = options.safeParse as (schema: object, input: unknown) => ValibotResultLike | Promise<ValibotResultLike>;
        return async (values) => {
            const result = await parse(schema, values);
            return result.success ? { errors: {}, values: result.output as Output } : { errors: fromIssues(result.issues) };
        };
    }
    if (!('~standard' in schema)) throw new TypeError('valibotResolver: the schema has no `~standard` property; pass `{ safeParse }` from valibot.');
    return standardSchemaResolver(schema as StandardSchemaLike<Output>);
}

// ---------------------------------------------------------------- superstruct

/** The part of a Superstruct struct the adapter uses. */
export interface SuperstructLike<Output = unknown> {
    validate(value: unknown, options?: { coerce?: boolean; mask?: boolean }): [error: { failures(): readonly { message: string; path: readonly PathSegment[] }[] } | undefined, value: Output | undefined];
}

/** Validates with a Superstruct struct; `coerce` applies its coercions to the submitted values. */
export function superstructResolver<Output = any>(struct: SuperstructLike<Output>, options: { coerce?: boolean; mask?: boolean } = {}): Resolver {
    return (values) => {
        const [error, output] = struct.validate(values, options);
        return error ? { errors: fromIssues(error.failures()) } : { errors: {}, values: output };
    };
}

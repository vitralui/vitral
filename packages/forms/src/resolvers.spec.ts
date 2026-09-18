import { describe, expect, it } from 'vitest';
import {
    functionResolver,
    mergeErrors,
    normalizeErrors,
    standardSchemaResolver,
    superstructResolver,
    valibotResolver,
    yupResolver,
    zodResolver,
    type SuperstructLike,
    type YupSchemaLike,
    type ZodSchemaLike
} from './resolvers';

// Fake schemas with the same shape as each library's, so the adapters are
// tested without depending on any of them.

interface Values {
    name?: string;
    items?: { title?: string }[];
}

const signal = new AbortController().signal;
const ctx = { signal };

function issues(values: Values) {
    const out: { message: string; path: (string | number)[] }[] = [];
    if (!values.name) out.push({ message: 'Name is required', path: ['name'] });
    values.items?.forEach((item, i) => {
        if (!item.title) out.push({ message: 'Title is required', path: ['items', i, 'title'] });
    });
    return out;
}

const trim = (values: Values): Values => ({ ...values, name: values.name?.trim() });

const zodLike: ZodSchemaLike<Values> = {
    safeParse(value) {
        const list = issues(value as Values);
        return list.length ? { success: false, error: { issues: list } } : { success: true, data: trim(value as Values) };
    }
};

describe('normalizeErrors', () => {
    it('flattens nested and flat errors, dropping empty entries', () => {
        expect(
            normalizeErrors({
                name: 'Required',
                'items[0].title': 'Missing',
                address: { city: ['Too short', 'Unknown'], zip: undefined },
                tags: [null as never, { label: 'Bad' }],
                ok: '',
                fine: false,
                none: null
            })
        ).toEqual({ name: ['Required'], 'items.0.title': ['Missing'], 'address.city': ['Too short', 'Unknown'], 'tags.1.label': ['Bad'] });
        expect(normalizeErrors({ list: ['One', 'Two'] })).toEqual({ list: ['One', 'Two'] });
        expect(normalizeErrors(undefined)).toEqual({});
    });

    it('merges without repeating a message', () => {
        expect(mergeErrors({ a: ['x'] }, { a: ['x', 'y'], b: ['z'] }, { c: [] })).toEqual({ a: ['x', 'y'], b: ['z'] });
    });
});

describe('resolvers', () => {
    it('functionResolver takes errors from a plain function, sync or async', async () => {
        const sync = functionResolver<Values>((v) => ({ name: v.name ? undefined : 'Required' }));
        expect(await sync({}, ctx)).toEqual({ errors: { name: ['Required'] } });
        expect(await sync({ name: 'a' }, ctx)).toEqual({ errors: {} });
        const async = functionResolver<Values>(async (v) => (v.name === 'taken' ? { name: 'Taken' } : undefined));
        expect(await async({ name: 'taken' }, ctx)).toEqual({ errors: { name: ['Taken'] } });
        expect(await async({ name: 'free' }, ctx)).toEqual({ errors: {} });
    });

    it('zodResolver maps issues to paths and returns parsed data', async () => {
        const resolver = zodResolver(zodLike);
        expect(await resolver({ items: [{ title: 'a' }, {}] }, ctx)).toEqual({ errors: { name: ['Name is required'], 'items.1.title': ['Title is required'] } });
        expect(await resolver({ name: '  Ada  ' }, ctx)).toEqual({ errors: {}, values: { name: 'Ada' } });
    });

    it('zodResolver prefers safeParseAsync when the schema has it', async () => {
        const calls: string[] = [];
        const schema: ZodSchemaLike<Values> = {
            safeParse: (v) => (calls.push('sync'), zodLike.safeParse(v)),
            safeParseAsync: async (v) => (calls.push('async'), zodLike.safeParse(v))
        };
        await zodResolver(schema)({ name: 'x' }, ctx);
        await zodResolver(schema, { async: false })({ name: 'x' }, ctx);
        expect(calls).toEqual(['async', 'sync']);
    });

    it('yupResolver collects every error from a ValidationError and casts values', async () => {
        const seen: unknown[] = [];
        const schema: YupSchemaLike<Values> = {
            async validate(value, options) {
                seen.push(options);
                const list = issues(value as Values);
                if (!list.length) return trim(value as Values);
                const inner = list.map((issue) => ({ message: issue.message, path: issue.path.map((p, i) => (typeof p === 'number' ? `[${p}]` : i ? `.${p}` : p)).join('') }));
                throw Object.assign(new Error(`${inner.length} errors`), { name: 'ValidationError', inner, path: undefined });
            }
        };
        const resolver = yupResolver(schema);
        expect(await resolver({ items: [{}] }, ctx)).toEqual({ errors: { name: ['Name is required'], 'items.0.title': ['Title is required'] } });
        expect(seen[0]).toMatchObject({ abortEarly: false });
        expect(await resolver({ name: ' B ' }, ctx)).toEqual({ errors: {}, values: { name: 'B' } });
    });

    it('yupResolver reads a single error without inner ones, and rethrows anything else', async () => {
        const single: YupSchemaLike = {
            validate: async () => {
                throw Object.assign(new Error('Bad name'), { name: 'ValidationError', path: 'name', inner: [] });
            }
        };
        expect(await yupResolver(single)({}, ctx)).toEqual({ errors: { name: ['Bad name'] } });
        const broken: YupSchemaLike = {
            validate: async () => {
                throw new TypeError('boom');
            }
        };
        await expect(yupResolver(broken)({}, ctx)).rejects.toThrow('boom');
    });

    it('standardSchemaResolver and valibotResolver read Standard Schema issues, keys as objects', async () => {
        const schema = {
            '~standard': {
                validate: (value: unknown) => {
                    const list = issues(value as Values);
                    return list.length ? { issues: list.map((i) => ({ message: i.message, path: i.path.map((key) => ({ key })) })) } : { value: trim(value as Values) };
                }
            }
        };
        expect(await standardSchemaResolver(schema)({ items: [{}] }, ctx)).toEqual({ errors: { name: ['Name is required'], 'items.0.title': ['Title is required'] } });
        expect(await valibotResolver(schema)({ name: 'x ' }, ctx)).toEqual({ errors: {}, values: { name: 'x' } });
    });

    it('valibotResolver takes safeParse for schemas without Standard Schema', async () => {
        const schema = { type: 'object' };
        const safeParse = async (s: unknown, input: unknown) => {
            expect(s).toBe(schema);
            const list = issues(input as Values);
            return list.length ? { success: false, issues: list.map((i) => ({ message: i.message, path: i.path.map((key) => ({ key })) })) } : { success: true, output: input };
        };
        const resolver = valibotResolver(schema, { safeParse: safeParse as never });
        expect(await resolver({}, ctx)).toEqual({ errors: { name: ['Name is required'] } });
        expect(await resolver({ name: 'x' }, ctx)).toEqual({ errors: {}, values: { name: 'x' } });
        expect(() => valibotResolver(schema)).toThrow(/safeParse/);
    });

    it('superstructResolver reads failures and passes options through', async () => {
        const seen: unknown[] = [];
        const struct: SuperstructLike<Values> = {
            validate(value, options) {
                seen.push(options);
                const list = issues(value as Values);
                return list.length ? [{ failures: () => list }, undefined] : [undefined, options?.coerce ? trim(value as Values) : (value as Values)];
            }
        };
        expect(await superstructResolver(struct)({ items: [{}] }, ctx)).toEqual({ errors: { name: ['Name is required'], 'items.0.title': ['Title is required'] } });
        expect(await superstructResolver(struct, { coerce: true })({ name: ' y ' }, ctx)).toEqual({ errors: {}, values: { name: 'y' } });
        expect(seen[1]).toEqual({ coerce: true });
    });
});

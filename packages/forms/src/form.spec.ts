import { afterEach, describe, expect, it, vi } from 'vitest';
import { createForm } from './form';
import { functionResolver } from './resolvers';
import { custom, email, equalsField, minLength, required, type Rule } from './rules';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
    vi.useRealTimers();
});

describe('createForm — state', () => {
    it('starts from a copy of the initial values, clean and valid', () => {
        const initialValues = { name: 'Ada', address: { city: 'Recife' } };
        const form = createForm({ initialValues });
        const state = form.getState();
        expect(state.values).toEqual(initialValues);
        expect(state.values).not.toBe(initialValues);
        expect(state).toMatchObject({ valid: true, dirty: false, submitting: false, submitted: false, submitFailed: false, submitCount: 0, validating: false });
    });

    it('sets nested and array values immutably, and tracks dirtiness', () => {
        const form = createForm({ initialValues: { address: { city: 'Recife' }, tags: ['a'] } });
        const before = form.getState();
        form.setValue('address.city', 'Olinda');
        form.setValue('tags[1]', 'b');
        const after = form.getState();
        expect(after.values).toEqual({ address: { city: 'Olinda' }, tags: ['a', 'b'] });
        expect(before.values.address.city).toBe('Recife');
        expect(after.dirty).toBe(true);
        expect(form.isDirty('address.city')).toBe(true);
        expect(form.getField('tags.0')).toMatchObject({ value: 'a', dirty: false });
        form.setValue('address.city', 'Recife');
        form.setValue('tags', ['a']);
        expect(form.getState().dirty).toBe(false);
    });

    it('notifies subscribers with a new snapshot on each change, until they leave', () => {
        const form = createForm({ initialValues: { a: 1 } });
        const seen: number[] = [];
        const stop = form.subscribe((state) => seen.push(state.values.a));
        form.setValue('a', 2);
        form.setValue('a', 2);
        stop();
        form.setValue('a', 3);
        expect(seen).toEqual([2]);
    });

    it('touches fields and reports a field snapshot', () => {
        const form = createForm({ initialValues: { email: '' } });
        form.register('email', { rules: [required()], label: 'Email' });
        form.touch('email');
        expect(form.getField('email')).toMatchObject({ touched: true, validated: false, invalid: false, required: true, error: undefined });
        form.touch('email', false);
        expect(form.getField('email').touched).toBe(false);
        expect(form.labelOf('email')).toBe('Email');
        expect(form.labelOf('other')).toBe('other');
    });

    it('takes a field initial value when the form has none', () => {
        const form = createForm<{ nick?: string }>({});
        form.register('nick', { initialValue: 'guest' });
        expect(form.getValue('nick')).toBe('guest');
        expect(form.getState().dirty).toBe(false);
    });

    it('replaces the values wholesale, validating only when asked', async () => {
        const form = createForm({ initialValues: { a: '' }, validateOn: 'input' });
        form.register('a', { rules: required() });
        form.setValues({ a: '' });
        form.setValues({ a: 'x' });
        await tick();
        expect(form.getField('a').validated).toBe(false);
        form.setValues({ a: '' }, { trigger: 'input' });
        await tick();
        expect(form.getError('a')).toBe('This field is required.');
    });
});

describe('createForm — validation', () => {
    it('validates everything on submit by default, not before', async () => {
        const form = createForm({ initialValues: { email: '' } });
        form.register('email', { rules: [required(), email()] });
        form.setValue('email', 'x');
        form.blur('email');
        await tick();
        expect(form.getField('email').validated).toBe(false);
        const result = await form.submit();
        expect(result.valid).toBe(false);
        expect(result.errors).toEqual({ email: ['Enter an email address like name@example.com.'] });
        expect(form.getField('email')).toMatchObject({ validated: true, invalid: true, touched: true });
    });

    it('stops at the first failing rule of a field', async () => {
        const second = vi.fn(() => undefined);
        const form = createForm({ initialValues: { a: '' } });
        form.register('a', { rules: [required(), second] });
        await form.validate();
        expect(second).not.toHaveBeenCalled();
        expect(form.getErrors('a')).toEqual(['This field is required.']);
    });

    it('validates on blur in blur mode, then again as the user types', async () => {
        const form = createForm({ initialValues: { name: '' }, validateOn: 'blur' });
        form.register('name', { rules: [required(), minLength(3)] });
        form.setValue('name', 'a');
        await tick();
        expect(form.getField('name').validated).toBe(false);
        await form.blur('name');
        expect(form.getError('name')).toBe('Enter at least 3 characters.');
        // Reward early: once shown, the error clears as soon as the value is right.
        form.setValue('name', 'abc');
        await tick();
        expect(form.getError('name')).toBeUndefined();
    });

    it('does not check again on blur when nothing changed', async () => {
        const rule = vi.fn(() => undefined);
        const form = createForm({ initialValues: { a: 'x' }, validateOn: 'blur' });
        form.register('a', { rules: rule });
        await form.blur('a');
        await form.blur('a');
        expect(rule).toHaveBeenCalledTimes(1);
    });

    it('validates on committed changes in change mode, and on every input in input mode', async () => {
        const form = createForm({ initialValues: { a: '', b: '' } });
        form.register('a', { rules: required(), validateOn: 'change' });
        form.register('b', { rules: required(), validateOn: 'input' });
        form.setValue('a', 'x', { trigger: 'input' });
        form.setValue('a', '', { trigger: 'input' });
        await tick();
        expect(form.getField('a').validated).toBe(false);
        form.setValue('a', 'y', { trigger: 'change' });
        await tick();
        expect(form.getField('a').validated).toBe(true);
        form.setValue('b', 'x');
        form.setValue('b', '');
        await tick();
        expect(form.getError('b')).toBe('This field is required.');
        // input mode implies change.
        form.setValue('b', 'z', { trigger: 'change' });
        await tick();
        expect(form.getError('b')).toBeUndefined();
    });

    it('validates a text field when its native change event is reported', async () => {
        const form = createForm({ initialValues: { a: '' }, validateOn: 'change' });
        form.register('a', { rules: minLength(2) });
        form.setValue('a', 'x');
        await tick();
        expect(form.getField('a').validated).toBe(false);
        await form.commit('a');
        expect(form.getError('a')).toBe('Enter at least 2 characters.');
    });

    it('lets a field choose its own mode, and never validates with trigger false', async () => {
        const form = createForm({ initialValues: { a: '', b: '' }, validateOn: 'input' });
        form.register('a', { rules: required(), validateOn: 'submit' });
        form.register('b', { rules: required() });
        form.setValue('a', 'x');
        form.setValue('a', '');
        form.setValue('b', 'x', { trigger: false });
        form.setValue('b', '', { trigger: false });
        await tick();
        expect(form.getField('a').validated).toBe(false);
        expect(form.getField('b').validated).toBe(false);
    });

    it('revalidates on the mode it is told to after a field was validated', async () => {
        const form = createForm({ initialValues: { a: '' }, validateOn: 'blur', revalidateOn: 'blur' });
        form.register('a', { rules: required() });
        await form.blur('a');
        form.setValue('a', 'x');
        await tick();
        expect(form.getError('a')).toBe('This field is required.');
        await form.blur('a');
        expect(form.getError('a')).toBeUndefined();
    });

    it('after a failed submit, every field follows the revalidation mode', async () => {
        const form = createForm({ initialValues: { a: '', b: '' } });
        form.register('a', { rules: required() });
        form.register('b', { rules: required() });
        await form.submit();
        expect(Object.keys(form.getState().errors)).toEqual(['a', 'b']);
        form.setValue('a', 'x');
        await tick();
        expect(form.getState().errors).toEqual({ b: ['This field is required.'] });
    });

    it('takes rules declared on the form by path', async () => {
        const form = createForm({ initialValues: { user: { email: '' } }, rules: { 'user.email': [required()] } });
        expect(form.fields()).toEqual(['user.email']);
        expect(form.isRequired('user.email')).toBe(true);
        const result = await form.validate();
        expect(result.errors).toEqual({ 'user.email': ['This field is required.'] });
    });

    it('validates the paths it is given, and answers per field', async () => {
        const form = createForm({ initialValues: { a: '', b: '' } });
        form.register('a', { rules: required() });
        form.register('b', { rules: required() });
        const result = await form.validate('a');
        expect(result.valid).toBe(false);
        expect(Object.keys(form.getState().errors)).toEqual(['a']);
        expect(await form.validateField('b')).toBe(false);
        form.setValue('b', 'x', { trigger: false });
        expect(await form.validateField('b', 'submit')).toBe(true);
        expect((await form.validate(['b'], { trigger: 'blur' })).valid).toBe(true);
    });

    it('validates a dependent field again when the field it reads changes', async () => {
        const form = createForm({ initialValues: { password: 'secret', confirm: '' }, validateOn: 'blur' });
        form.register('password', { rules: required(), label: 'Password' });
        form.register('confirm', { rules: [required(), equalsField('password')] });
        form.setValue('confirm', 'secre');
        await form.blur('confirm');
        expect(form.getError('confirm')).toBe('This has to match Password.');
        form.setValue('password', 'secre');
        await tick();
        expect(form.getError('confirm')).toBeUndefined();
    });

    it('follows explicit deps too', async () => {
        const rule: Rule = (value, ctx) => (Number(value) > Number(ctx.get('max')) ? 'Too big' : undefined);
        const form = createForm({ initialValues: { max: 10, value: 5 } });
        form.register('value', { rules: rule, deps: ['max'] });
        await form.validate();
        expect(form.getError('value')).toBeUndefined();
        form.setValue('max', 3);
        await tick();
        expect(form.getError('value')).toBe('Too big');
    });

    it('runs cross-field checks and reports errors on the paths they name', async () => {
        const form = createForm({
            initialValues: { start: 5, end: 2 },
            validate: (values) => (values.end < values.start ? { end: 'The end comes before the start.' } : undefined)
        });
        form.register('start');
        form.register('end');
        const result = await form.validate();
        expect(result.errors).toEqual({ end: ['The end comes before the start.'] });
        // Once validated, a change to either field re-checks the other.
        form.setValue('start', 1);
        await tick();
        expect(form.getState().errors).toEqual({});
    });

    it('treats false from a rule as the generic message', async () => {
        const form = createForm({ initialValues: { a: 1 }, messages: { invalid: 'Nope.' } });
        form.register('a', { rules: () => false });
        await form.validate();
        expect(form.getError('a')).toBe('Nope.');
    });

    it('reads messages through a function, so a locale switch is followed', async () => {
        let text = 'Required.';
        const form = createForm({ initialValues: { a: '' }, messages: () => ({ required: text }) });
        form.register('a', { rules: required() });
        await form.validate();
        expect(form.getError('a')).toBe('Required.');
        text = 'Obrigatório.';
        expect(form.messages.required).toBe('Obrigatório.');
        await form.validate();
        expect(form.getError('a')).toBe('Obrigatório.');
    });

    it('lets errors be set, merged, replaced and cleared by hand', () => {
        const form = createForm({ initialValues: { a: '', b: { c: '' } } });
        form.setError('a', 'Server says no');
        expect(form.getField('a')).toMatchObject({ error: 'Server says no', validated: true, invalid: true });
        form.setErrors({ b: { c: 'Bad' } });
        expect(form.getErrors()).toEqual(['Server says no', 'Bad']);
        form.clearErrors('b');
        expect(form.getState().errors).toEqual({ a: ['Server says no'] });
        form.setErrors({ x: 'Only' }, { replace: true });
        expect(form.getState().errors).toEqual({ x: ['Only'] });
        form.setError('x', undefined);
        expect(form.getState().valid).toBe(true);
        form.setError('a', ['One', 'Two']);
        form.clearErrors();
        expect(form.getState().valid).toBe(true);
    });

    it('surfaces an error thrown by a rule to the caller', async () => {
        const form = createForm({ initialValues: { a: '' } });
        form.register('a', {
            rules: () => {
                throw new Error('broken rule');
            }
        });
        await expect(form.validate()).rejects.toThrow('broken rule');
        expect(form.getState().validating).toBe(false);
    });
});

describe('createForm — async validation', () => {
    it('marks a field validating while an async rule runs', async () => {
        let finish!: (value: string | undefined) => void;
        const form = createForm({ initialValues: { user: 'ada' }, validateOn: 'input' });
        form.register('user', { rules: custom(() => new Promise<string | undefined>((resolve) => (finish = resolve))) });
        const done = form.validateField('user');
        expect(form.getState().validating).toBe(true);
        expect(form.getField('user').validating).toBe(true);
        finish('Taken');
        expect(await done).toBe(false);
        expect(form.getState().validating).toBe(false);
        expect(form.getError('user')).toBe('Taken');
    });

    it('cancels a stale run: its signal aborts and its result is dropped', async () => {
        const signals: AbortSignal[] = [];
        const resolvers: ((v: string | undefined) => void)[] = [];
        const form = createForm({ initialValues: { user: '' }, validateOn: 'input' });
        form.register('user', {
            rules: (value, ctx) => {
                signals.push(ctx.signal);
                return new Promise<string | undefined>((resolve) => resolvers.push(() => resolve(value === 'taken' ? 'Taken' : undefined)));
            }
        });
        form.setValue('user', 'taken');
        form.setValue('user', 'free');
        expect(signals).toHaveLength(2);
        expect(signals[0]!.aborted).toBe(true);
        expect(signals[1]!.aborted).toBe(false);
        // The newer run finishes first; the older one finishing later changes nothing.
        resolvers[1]!(undefined);
        await tick();
        resolvers[0]!(undefined);
        await tick();
        expect(form.getError('user')).toBeUndefined();
        expect(form.getState().validating).toBe(false);
    });

    it('resolves a superseded validateField with the latest outcome', async () => {
        const form = createForm({ initialValues: { user: 'taken' } });
        let delay = 20;
        form.register('user', { rules: custom(async (v) => {
                await new Promise((r) => setTimeout(r, (delay -= 15)));
                return v !== 'taken';
            }) });
        const first = form.validateField('user');
        form.setValue('user', 'free', { trigger: false });
        const second = form.validateField('user');
        expect(await first).toBe(true);
        expect(await second).toBe(true);
    });

    it('ignores rejections caused by the abort', async () => {
        const form = createForm({ initialValues: { a: 'x' }, validateOn: 'input' });
        form.register('a', {
            rules: (_v, ctx) =>
                new Promise((_resolve, reject) => {
                    ctx.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
                })
        });
        const first = form.validate('a');
        form.reset();
        await expect(first).resolves.toMatchObject({ valid: true });
    });

    it('debounces input-triggered validation and flushes it on blur', async () => {
        vi.useFakeTimers();
        const rule = vi.fn((v: unknown) => (v === 'bad' ? 'Bad' : undefined));
        const form = createForm({ initialValues: { a: '' }, validateOn: 'input', debounce: 300 });
        form.register('a', { rules: rule });
        form.setValue('a', 'b');
        form.setValue('a', 'ba');
        form.setValue('a', 'bad');
        expect(form.getField('a').validating).toBe(true);
        await vi.advanceTimersByTimeAsync(299);
        expect(rule).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(rule).toHaveBeenCalledTimes(1);
        expect(form.getError('a')).toBe('Bad');

        form.setValue('a', 'good');
        const flushed = form.blur('a');
        expect(flushed).toBeInstanceOf(Promise);
        await flushed;
        expect(rule).toHaveBeenCalledTimes(2);
        expect(form.getError('a')).toBeUndefined();
        await vi.advanceTimersByTimeAsync(500);
        expect(rule).toHaveBeenCalledTimes(2);
    });

    it('waits on a debounced field when asked for its validity', async () => {
        vi.useFakeTimers();
        const form = createForm({ initialValues: { a: '' }, validateOn: 'input' });
        form.register('a', { rules: required(), debounce: 100 });
        const pending = form.validate('a', { trigger: 'input' });
        let settled = false;
        void pending.then(() => (settled = true));
        await vi.advanceTimersByTimeAsync(50);
        expect(settled).toBe(false);
        await vi.advanceTimersByTimeAsync(60);
        expect(settled).toBe(true);
        expect((await pending).valid).toBe(false);
    });

    it('does not debounce blur, change or submit', async () => {
        vi.useFakeTimers();
        const form = createForm({ initialValues: { a: '' }, validateOn: ['blur', 'change'], debounce: 1000 });
        form.register('a', { rules: required() });
        await form.blur('a');
        expect(form.getError('a')).toBeDefined();
        form.setValue('a', 'x', { trigger: 'change' });
        await vi.advanceTimersByTimeAsync(0);
        expect(form.getError('a')).toBeUndefined();
    });

    it('runs an async resolver and drops a stale run', async () => {
        const calls: { values: Record<string, unknown>; signal: AbortSignal; release: () => void }[] = [];
        const form = createForm({
            initialValues: { name: '' },
            validateOn: 'input',
            resolver: (values, { signal }) =>
                new Promise((resolve) => {
                    calls.push({ values, signal, release: () => resolve({ errors: values.name === 'x' ? { name: ['No x'] } : {} }) });
                })
        });
        form.setValue('name', 'x');
        form.setValue('name', 'y');
        expect(calls[0]!.signal.aborted).toBe(true);
        calls[1]!.release();
        await tick();
        calls[0]!.release();
        await tick();
        expect(form.getState().errors).toEqual({});
        expect(form.getField('name').validated).toBe(true);
    });
});

describe('createForm — resolvers', () => {
    const resolver = functionResolver<{ name?: string; age?: number; items?: { title: string }[] }>((v) => ({
        name: v.name ? undefined : 'Name is required',
        age: (v.age ?? 0) < 18 ? 'Adults only' : undefined,
        items: v.items?.map((item) => ({ title: item.title ? undefined : 'Title is required' }))
    }));

    it('reports every resolver error on submit, fields registered or not', async () => {
        const form = createForm({ initialValues: { name: '', age: 10, items: [{ title: '' }] }, resolver });
        form.register('name');
        const result = await form.submit();
        expect(result.errors).toEqual({ name: ['Name is required'], age: ['Adults only'], 'items.0.title': ['Title is required'] });
        expect(form.getField('age').validated).toBe(true);
    });

    it('writes only the validated field when one field is checked', async () => {
        const form = createForm({ initialValues: { name: '', age: 10 }, resolver, validateOn: 'blur' });
        form.register('name');
        form.register('age');
        await form.blur('name');
        expect(form.getState().errors).toEqual({ name: ['Name is required'] });
    });

    it('validates an unregistered path by its mode too', async () => {
        const form = createForm({ initialValues: { name: '' }, resolver, validateOn: 'input' });
        form.setValue('name', 'a');
        form.setValue('name', '');
        await tick();
        expect(form.getError('name')).toBe('Name is required');
    });

    it('submits the values the resolver hands back', async () => {
        const onSubmit = vi.fn();
        const form = createForm({ initialValues: { name: ' Ada ' }, resolver: () => ({ errors: {}, values: { name: 'Ada' } }), onSubmit });
        await form.submit();
        expect(onSubmit.mock.calls[0]![0]).toEqual({ name: 'Ada' });
    });

    it('merges field rules, resolver errors and cross-field checks', async () => {
        const form = createForm({
            initialValues: { name: '' },
            resolver: () => ({ errors: { name: ['From schema'] } }),
            validate: () => ({ name: 'From check' })
        });
        form.register('name', { rules: required('From rule') });
        await form.validate();
        expect(form.getErrors('name')).toEqual(['From rule', 'From schema', 'From check']);
    });

    it('keeps a newer single-field result over an older full run', async () => {
        const gates: (() => void)[] = [];
        const form = createForm({
            initialValues: { name: '' },
            resolver: (values) => new Promise((resolve) => gates.push(() => resolve({ errors: values.name ? {} : { name: ['Required'] } })))
        });
        form.register('name');
        const full = form.validate();
        form.setValue('name', 'Ada', { trigger: false });
        const single = form.validateField('name', 'submit');
        gates[1]!();
        await single;
        gates[0]!();
        await full;
        expect(form.getState().errors).toEqual({});
    });
});

describe('createForm — submit and reset', () => {
    it('calls the handler with the values when valid, tracking submitting', async () => {
        let release!: () => void;
        const form = createForm({ initialValues: { a: 'x' } });
        form.register('a', { rules: required() });
        const seen: boolean[] = [];
        form.subscribe((s) => seen.push(s.submitting));
        const handler = vi.fn(() => new Promise<void>((resolve) => (release = resolve)));
        const done = form.submit(handler);
        expect(form.getState().submitting).toBe(true);
        expect(form.submit()).toBe(done);
        await tick();
        expect(handler).toHaveBeenCalledWith({ a: 'x' }, expect.objectContaining({ setErrors: expect.any(Function) }));
        release();
        const result = await done;
        expect(result.valid).toBe(true);
        expect(form.getState()).toMatchObject({ submitting: false, submitted: true, submitFailed: false, submitCount: 1 });
        expect(seen[0]).toBe(true);
        expect(seen.at(-1)).toBe(false);
    });

    it('calls the invalid handler instead when validation fails', async () => {
        const onSubmit = vi.fn();
        const onInvalidSubmit = vi.fn();
        const form = createForm({ initialValues: { a: '' }, onSubmit, onInvalidSubmit });
        form.register('a', { rules: required() });
        await form.submit();
        expect(onSubmit).not.toHaveBeenCalled();
        expect(onInvalidSubmit).toHaveBeenCalledWith(expect.objectContaining({ valid: false, errors: { a: ['This field is required.'] } }));
        expect(form.getState()).toMatchObject({ submitting: false, submitted: false, submitFailed: true, submitCount: 1 });
        const own = vi.fn();
        await form.submit(undefined, own);
        expect(own).toHaveBeenCalled();
        expect(form.getState().submitCount).toBe(2);
    });

    it('counts a submit as failed when the handler reports server errors', async () => {
        const form = createForm({ initialValues: { email: 'a@b.co' } });
        form.register('email');
        const result = await form.submit((_values, { setErrors }) => setErrors({ email: 'Already registered' }));
        expect(result.valid).toBe(false);
        expect(form.getField('email')).toMatchObject({ invalid: true, error: 'Already registered' });
        expect(form.getState()).toMatchObject({ submitted: false, submitFailed: true });
        // The next submit starts from scratch: the server error is gone once the field is checked again.
        const again = await form.submit(() => undefined);
        expect(again.valid).toBe(true);
    });

    it('rethrows a failing handler and leaves the form usable', async () => {
        const form = createForm({ initialValues: {} });
        await expect(form.submit(() => Promise.reject(new Error('offline')))).rejects.toThrow('offline');
        expect(form.getState()).toMatchObject({ submitting: false, submitFailed: true });
        await expect(form.submit(() => undefined)).resolves.toMatchObject({ valid: true });
    });

    it('resets to the initial values, or to new ones, clearing everything', async () => {
        const form = createForm({ initialValues: { a: '', b: 'keep' } });
        form.register('a', { rules: required() });
        form.setValue('a', 'x');
        form.setValue('b', 'changed');
        form.touch('a');
        await form.submit(() => undefined);
        form.setError('a', 'x');
        form.reset();
        expect(form.getState()).toMatchObject({ values: { a: '', b: 'keep' }, errors: {}, touched: {}, validated: {}, submitCount: 0, submitted: false, dirty: false });
        form.reset({ a: 'new', b: 'new' });
        expect(form.getState()).toMatchObject({ values: { a: 'new', b: 'new' }, initialValues: { a: 'new', b: 'new' }, dirty: false });
    });

    it('lets the handler reset the form', async () => {
        const form = createForm({ initialValues: { a: '' } });
        form.setValue('a', 'sent');
        await form.submit((_v, { reset }) => reset());
        expect(form.getState()).toMatchObject({ values: { a: '' }, submitting: false });
    });

    it('resets one field, optionally to a new initial value', async () => {
        const form = createForm({ initialValues: { a: 'x', b: 'y' } });
        form.register('a', { rules: minLength(5) });
        form.setValue('a', 'changed');
        form.setValue('b', 'changed');
        await form.validate();
        form.resetField('a');
        expect(form.getState().values).toEqual({ a: 'x', b: 'changed' });
        expect(form.getField('a')).toMatchObject({ validated: false, error: undefined });
        form.resetField('b', 'fresh');
        expect(form.getField('b')).toMatchObject({ value: 'fresh', dirty: false });
    });

    it('forgets an unregistered field once nobody replaces it', async () => {
        const form = createForm({ initialValues: { a: '' } });
        const reg = form.register('a', { rules: required() });
        await form.validate();
        expect(form.getState().valid).toBe(false);
        reg.unregister();
        reg.unregister();
        await tick();
        expect(form.getState().valid).toBe(true);
        expect(form.fields()).toEqual([]);

        const first = form.register('a', { rules: required() });
        await form.validate();
        first.unregister();
        const second = form.register('a', { rules: required() });
        await tick();
        expect(form.getError('a')).toBe('This field is required.');
        second.update({ rules: [] });
        await form.validate();
        expect(form.getState().valid).toBe(true);
    });

    it('stops timers and runs on destroy', async () => {
        vi.useFakeTimers();
        const rule = vi.fn(() => undefined);
        const form = createForm({ initialValues: { a: '' }, validateOn: 'input', debounce: 100 });
        form.register('a', { rules: rule });
        form.setValue('a', 'x');
        form.destroy();
        await vi.advanceTimersByTimeAsync(200);
        expect(rule).not.toHaveBeenCalled();
    });
});

describe('createForm — field arrays', () => {
    const setup = () => {
        const form = createForm({ initialValues: { items: [{ title: 'a' }, { title: '' }, { title: 'c' }] } });
        const items = form.array<{ title: string }>('items');
        for (let i = 0; i < 3; i++) form.register(`items.${i}.title`, { rules: required() });
        return { form, items };
    };

    it('gives each item a stable key', () => {
        const { items } = setup();
        const keys = items.keys();
        expect(keys).toHaveLength(3);
        expect(new Set(keys).size).toBe(3);
        expect(items.keys()).toEqual(keys);
    });

    it('appends, prepends and inserts, keeping keys and per-item state with their items', async () => {
        const { form, items } = setup();
        await form.validate();
        const [k0, k1, k2] = items.keys();
        expect(form.getError('items.1.title')).toBeDefined();
        items.prepend({ title: 'z' });
        expect(form.getValues().items.map((i) => i.title)).toEqual(['z', 'a', '', 'c']);
        expect(items.keys().slice(1)).toEqual([k0, k1, k2]);
        expect(form.getError('items.2.title')).toBeDefined();
        expect(form.getError('items.1.title')).toBeUndefined();
        items.insert(1, { title: 'y' });
        expect(items.keys()[2]).toBe(k0);
        expect(form.getError('items.3.title')).toBeDefined();
        items.append({ title: 'end' }, { title: 'end2' });
        expect(form.getValues().items.at(-1)).toEqual({ title: 'end2' });
        expect(items.keys()).toHaveLength(7);
    });

    it('removes items, dropping their state and shifting the rest', async () => {
        const { form, items } = setup();
        await form.validate();
        form.touch('items.2.title');
        const [k0, , k2] = items.keys();
        items.remove(1);
        expect(form.getValues().items).toEqual([{ title: 'a' }, { title: 'c' }]);
        expect(items.keys()).toEqual([k0, k2]);
        expect(form.getState().errors).toEqual({});
        expect(form.getField('items.1.title').touched).toBe(true);
        items.remove([0, 1]);
        expect(form.getValues().items).toEqual([]);
    });

    it('moves and swaps items with their state', async () => {
        const { form, items } = setup();
        await form.validate();
        const [k0, k1, k2] = items.keys();
        items.move(1, 0);
        expect(form.getValues().items.map((i) => i.title)).toEqual(['', 'a', 'c']);
        expect(items.keys()).toEqual([k1, k0, k2]);
        expect(form.getError('items.0.title')).toBeDefined();
        items.swap(0, 2);
        expect(form.getValues().items.map((i) => i.title)).toEqual(['c', 'a', '']);
        expect(form.getError('items.2.title')).toBeDefined();
        expect(items.keys()).toEqual([k2, k0, k1]);
        // Out-of-range moves do nothing.
        items.move(5, 0);
        items.swap(0, 9);
        items.move(1, 1);
        expect(items.keys()).toEqual([k2, k0, k1]);
        items.move(0, 99);
        expect(items.keys()).toEqual([k0, k1, k2]);
    });

    it('replaces the list with fresh keys', () => {
        const { form, items } = setup();
        const before = items.keys();
        items.replace([{ title: 'only' }]);
        expect(form.getValues().items).toEqual([{ title: 'only' }]);
        expect(items.keys()).toHaveLength(1);
        expect(before).not.toContain(items.keys()[0]);
    });

    it('validates the list itself when its rules and mode say so', async () => {
        const form = createForm({ initialValues: { tags: [] as string[] }, validateOn: 'change' });
        form.register('tags', { rules: [required('Add a tag'), minLength(2)] });
        const tags = form.array<string>('tags');
        tags.append('a');
        await tick();
        expect(form.getError('tags')).toBe('Choose or add at least 2.');
        tags.append('b');
        await tick();
        expect(form.getError('tags')).toBeUndefined();
        tags.remove([0, 1]);
        await tick();
        expect(form.getError('tags')).toBe('Add a tag');
    });

    it('treats a missing list as empty and drops validations running under it', async () => {
        const form = createForm<{ rows?: { v: string }[] }>({ validateOn: 'input' });
        const rows = form.array<{ v: string }>('rows');
        expect(rows.keys()).toEqual([]);
        rows.append({ v: '' });
        const signals: AbortSignal[] = [];
        form.register('rows.0.v', { rules: (_v, ctx) => (signals.push(ctx.signal), new Promise(() => undefined)) });
        form.setValue('rows.0.v', 'x');
        rows.prepend({ v: 'new' });
        expect(signals[0]!.aborted).toBe(true);
        expect(form.getState().validating).toBe(false);
    });
});

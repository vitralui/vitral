import { defaultFormMessages, type FormMessages } from './messages';
import { cloneValue, getIn, isEqual, isPathWithin, parsePath, setIn, toPath } from './path';
import { mergeErrors, normalizeErrors, type ErrorsInput, type FormErrors, type Resolver } from './resolvers';
import type { Rule, RuleContext, RuleResult } from './rules';

/**
 * When a field is validated:
 * - `submit`: only when the form is submitted;
 * - `blur`: when focus leaves the field;
 * - `change`: when a value is committed (a choice picked, a box ticked, text left after editing);
 * - `input`: on every change of the value, keystrokes included (implies `change`).
 */
export type ValidateOn = 'submit' | 'blur' | 'change' | 'input';

/** What caused a validation. */
export type ValidationTrigger = 'submit' | 'blur' | 'change' | 'input';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormValues = Record<string, any>;

export type Rules = Rule | readonly Rule[];

/** Checks that span fields: return errors by path (or nested), or a promise of them. */
export type FormValidator<Values = FormValues> = (values: Values, context: { signal: AbortSignal; messages: FormMessages }) => ErrorsInput | null | undefined | void | Promise<ErrorsInput | null | undefined | void>;

export interface FieldOptions {
    rules?: Rules;
    /** Overrides the form's `validateOn` for this field. */
    validateOn?: ValidateOn | readonly ValidateOn[];
    /** Overrides the form's `revalidateOn` for this field. */
    revalidateOn?: ValidateOn | readonly ValidateOn[];
    /** Milliseconds to wait after the last keystroke before validating (input-triggered validation only). */
    debounce?: number;
    /** Other paths whose changes validate this field again (once it has been validated). */
    deps?: readonly string[];
    /** The field's human name, for the error summary and for messages that mention it. */
    label?: string | (() => string | undefined);
    /** A value to start from when the form has none at this path. */
    initialValue?: unknown;
}

export interface FormOptions<Values extends FormValues = FormValues> {
    initialValues?: Values;
    /** Validates the whole form: a schema adapter (`zodResolver(schema)`) or `functionResolver(fn)`. */
    resolver?: Resolver<Values>;
    /** Cross-field checks, run beside the resolver and the rules. */
    validate?: FormValidator<Values>;
    /** Rules by path, declared in one place instead of on each field. */
    rules?: Record<string, Rules>;
    /** When fields are validated before the form has been submitted, and before they have been validated once. Defaults to `submit`. */
    validateOn?: ValidateOn | readonly ValidateOn[];
    /** When a field that has been validated is validated again. Defaults to `input`, so a fixed error clears as it is fixed. */
    revalidateOn?: ValidateOn | readonly ValidateOn[];
    /** Default debounce for input-triggered validation, in milliseconds. */
    debounce?: number;
    /** Texts for the built-in rules; a function is read on every validation, so a locale switch is followed. */
    messages?: Partial<FormMessages> | (() => Partial<FormMessages> | undefined);
    onSubmit?: (values: Values, helpers: SubmitHelpers<Values>) => unknown;
    onInvalidSubmit?: (result: ValidationResult<Values>) => unknown;
}

export interface FormState<Values extends FormValues = FormValues> {
    values: Values;
    initialValues: Values;
    /** Messages by dotted path. */
    errors: FormErrors;
    /** Paths the user has left (or that a submit has visited). */
    touched: Readonly<Record<string, true>>;
    /** Paths validated at least once: the point from which an error is shown and `aria-invalid` is set. */
    validated: Readonly<Record<string, true>>;
    /** Paths with a validation running. */
    validatingFields: Readonly<Record<string, true>>;
    validating: boolean;
    /** No errors are known. Fields not yet validated do not count against it. */
    valid: boolean;
    /** Some value differs from its initial value. */
    dirty: boolean;
    submitting: boolean;
    /** The last submit went through: the values were valid and the handler finished. */
    submitted: boolean;
    /** The last submit was stopped by errors (or the handler reported some). */
    submitFailed: boolean;
    submitCount: number;
}

export interface FieldSnapshot {
    path: string;
    value: unknown;
    initialValue: unknown;
    errors: string[];
    /** The first error. */
    error: string | undefined;
    touched: boolean;
    dirty: boolean;
    validated: boolean;
    validating: boolean;
    /** Validated and wrong: what `aria-invalid` follows. */
    invalid: boolean;
    required: boolean;
}

export interface ValidationResult<Values = FormValues> {
    valid: boolean;
    errors: FormErrors;
    /** The values, transformed by the resolver when it returns some. */
    values: Values;
}

export interface SubmitHelpers<Values = FormValues> {
    /** Reports errors found by the server; the submit then counts as failed. */
    setErrors(errors: ErrorsInput): void;
    setError(path: string, message: string | readonly string[] | undefined): void;
    reset(values?: Values): void;
    signal: AbortSignal;
}

export interface FieldRegistration {
    update(options: FieldOptions): void;
    unregister(): void;
}

export interface FieldArrayApi<Item = unknown> {
    /** Stable keys, one per item, for a `v-for` (or React) key. */
    keys(): string[];
    append(...items: Item[]): void;
    prepend(...items: Item[]): void;
    insert(index: number, ...items: Item[]): void;
    remove(index: number | readonly number[]): void;
    move(from: number, to: number): void;
    swap(a: number, b: number): void;
    replace(items: readonly Item[]): void;
}

export interface FormApi<Values extends FormValues = FormValues> {
    getState(): FormState<Values>;
    subscribe(listener: (state: FormState<Values>) => void): () => void;
    setOptions(options: Partial<FormOptions<Values>>): void;
    readonly messages: FormMessages;

    getValues(): Values;
    getValue<T = unknown>(path: string): T;
    /** Sets one value. `trigger` says what caused it, and so whether it validates; `false` never does. */
    setValue(path: string, value: unknown, options?: { trigger?: 'input' | 'change' | false; touch?: boolean }): void;
    setValues(values: Values, options?: { trigger?: 'input' | 'change' | false }): void;

    getField(path: string): FieldSnapshot;
    getErrors(path?: string): string[];
    getError(path: string): string | undefined;
    setError(path: string, message: string | readonly string[] | undefined): void;
    /** Adds errors (or, with `replace`, replaces them all). Their paths count as validated. */
    setErrors(errors: ErrorsInput, options?: { replace?: boolean }): void;
    clearErrors(path?: string): void;
    isDirty(path?: string): boolean;
    touch(path: string, touched?: boolean): void;
    /** Focus left the field: touches it and validates it when its mode says so. */
    blur(path: string): Promise<boolean> | undefined;
    /** Tells the form a value was committed (a native `change`), so `change` mode validates. */
    commit(path: string): Promise<boolean> | undefined;

    register(path: string, options?: FieldOptions): FieldRegistration;
    /** Every path the form knows rules for: registered fields and `options.rules`. */
    fields(): string[];
    isRequired(path: string): boolean;
    labelOf(path: string): string;

    /** Validates everything, or the paths given. */
    validate(paths?: string | readonly string[], options?: { trigger?: ValidationTrigger }): Promise<ValidationResult<Values>>;
    validateField(path: string, trigger?: ValidationTrigger): Promise<boolean>;
    /** Validates every field, then calls the handler (or `onSubmit`) with the values when they are valid. */
    submit(onValid?: FormOptions<Values>['onSubmit'], onInvalid?: FormOptions<Values>['onInvalidSubmit']): Promise<ValidationResult<Values>>;
    /** Back to the initial values (or to `values`, which become the initial ones), with every error and flag cleared. */
    reset(values?: Values): void;
    resetField(path: string, value?: unknown): void;

    array<Item = unknown>(path: string): FieldArrayApi<Item>;
    /** Stops pending validations and timers. */
    destroy(): void;
}

interface Run {
    id: number;
    controller: AbortController;
    paths: Set<string>;
    full: boolean;
}

interface Entry {
    options: FieldOptions;
}

const asList = <T>(value: T | readonly T[] | undefined): readonly T[] => (value === undefined ? [] : Array.isArray(value) ? (value as readonly T[]) : [value as T]);

function modeMatches(modes: readonly ValidateOn[], trigger: ValidationTrigger): boolean {
    if (trigger === 'submit') return true;
    if (modes.includes(trigger)) return true;
    return trigger === 'change' && modes.includes('input');
}

function without<T extends Record<string, unknown>>(record: T, predicate: (key: string) => boolean): T {
    let changed = false;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(record)) {
        if (predicate(key)) changed = true;
        else out[key] = record[key];
    }
    return (changed ? out : record) as T;
}

function isAbort(error: unknown): boolean {
    return !!error && typeof error === 'object' && (error as { name?: string }).name === 'AbortError';
}

let keySeed = 0;

/**
 * A form, with no framework in it: values, per-field state, validation and
 * submission. A view subscribes to its state and calls its methods; the Vue
 * components are one such view.
 */
export function createForm<Values extends FormValues = FormValues>(initialOptions: FormOptions<Values> = {}): FormApi<Values> {
    let options: FormOptions<Values> = { ...initialOptions };
    const initial = cloneValue((options.initialValues ?? {}) as Values);
    let state: FormState<Values> = {
        values: cloneValue(initial),
        initialValues: initial,
        errors: {},
        touched: {},
        validated: {},
        validatingFields: {},
        validating: false,
        valid: true,
        dirty: false,
        submitting: false,
        submitted: false,
        submitFailed: false,
        submitCount: 0
    };
    const listeners = new Set<(state: FormState<Values>) => void>();
    const entries = new Map<string, Set<Entry>>();
    const latest = new Map<string, Run>();
    const current = new Map<string, Promise<unknown>>();
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    /** Promises that settle when a debounced validation runs (or is cancelled), keyed by path. */
    const gates = new Map<string, () => void>();
    /** The id of the last run whose result was written, per path. */
    const applied = new Map<string, number>();
    /** The values object a path was last validated against: nothing changed since means nothing to check. */
    const checkedWith = new Map<string, Values>();
    const runs = new Set<Run>();
    const arrayKeys = new Map<string, string[]>();
    let runSeed = 0;
    let latestFull: Run | null = null;
    let submitting: Promise<ValidationResult<Values>> | null = null;
    let destroyed = false;

    function set(patch: Partial<FormState<Values>>) {
        const next = { ...state, ...patch } as FormState<Values>;
        if ('errors' in patch) next.valid = Object.keys(next.errors).length === 0;
        if ('validatingFields' in patch) next.validating = Object.keys(next.validatingFields).length > 0;
        if ('values' in patch || 'initialValues' in patch) next.dirty = !isEqual(next.values, next.initialValues);
        state = next;
        for (const listener of [...listeners]) listener(state);
    }

    function clearTimer(path: string) {
        const timer = timers.get(path);
        if (timer !== undefined) clearTimeout(timer);
        timers.delete(path);
        const release = gates.get(path);
        gates.delete(path);
        release?.();
    }

    function report(error: unknown) {
        console.error(error);
    }

    const messages = (): FormMessages => {
        const custom = typeof options.messages === 'function' ? options.messages() : options.messages;
        return custom ? { ...defaultFormMessages, ...custom } : defaultFormMessages;
    };

    // ------------------------------------------------------------ fields

    function entriesOf(path: string): Entry[] {
        return [...(entries.get(path) ?? [])];
    }

    function rulesOf(path: string): Rule[] {
        return [...asList(options.rules?.[path]), ...entriesOf(path).flatMap((entry) => asList(entry.options.rules))];
    }

    function fieldOption<K extends keyof FieldOptions>(path: string, key: K): FieldOptions[K] | undefined {
        const list = entriesOf(path);
        for (let i = list.length - 1; i >= 0; i--) if (list[i]!.options[key] !== undefined) return list[i]!.options[key];
        return undefined;
    }

    function known(): string[] {
        return [...new Set([...Object.keys(options.rules ?? {}).map(toPath), ...entries.keys()])];
    }

    function depsOf(path: string): string[] {
        return [...asList(fieldOption(path, 'deps')), ...rulesOf(path).flatMap((rule) => asList(rule.deps))].map(toPath);
    }

    function labelOf(path: string): string {
        const key = toPath(path);
        const label = fieldOption(key, 'label');
        const text = typeof label === 'function' ? label() : label;
        return text || key;
    }

    /** Validated against exactly the current values, with nothing pending: checking again would say the same. */
    function upToDate(path: string): boolean {
        return !!state.validated[path] && checkedWith.get(path) === state.values && !latest.has(path) && !timers.has(path);
    }

    function shouldValidate(path: string, trigger: ValidationTrigger): boolean {
        const validateOn = asList(fieldOption(path, 'validateOn') ?? options.validateOn ?? 'submit');
        if (!state.validated[path] && !state.submitFailed) return modeMatches(validateOn, trigger);
        const revalidateOn = asList(fieldOption(path, 'revalidateOn') ?? options.revalidateOn ?? 'input');
        return modeMatches([...validateOn, ...revalidateOn], trigger);
    }

    // ------------------------------------------------------------ validation

    function context(path: string, run: Run, values: Values): RuleContext<Values> {
        return { path, values, messages: messages(), signal: run.controller.signal, get: (p) => getIn(values, p), labelOf };
    }

    function settleRule(result: RuleResult, ctx: RuleContext): string | undefined {
        if (result === false) return ctx.messages.invalid;
        if (typeof result === 'string' && result !== '') return result;
        return undefined;
    }

    async function runRules(path: string, run: Run, values: Values): Promise<string[]> {
        const ctx = context(path, run, values);
        const value = getIn(values, path);
        for (const rule of rulesOf(path)) {
            let result = rule(value, ctx as RuleContext);
            if (result instanceof Promise) result = await result;
            if (run.controller.signal.aborted) return [];
            const message = settleRule(result, ctx as RuleContext);
            if (message) return [message];
        }
        return [];
    }

    function claim(run: Run, path: string) {
        const previous = latest.get(path);
        if (previous && previous !== run) {
            previous.paths.delete(path);
            if (previous.paths.size === 0 && !(previous.full && previous === latestFull)) previous.controller.abort();
        }
        latest.set(path, run);
        run.paths.add(path);
    }

    function finish(run: Run) {
        runs.delete(run);
        let validating = state.validatingFields;
        for (const path of run.paths) if (latest.get(path) === run) validating = without(validating, (key) => key === path);
        if (validating !== state.validatingFields) set({ validatingFields: validating });
    }

    async function execute(paths: string[], full: boolean): Promise<ValidationResult<Values>> {
        const run: Run = { id: ++runSeed, controller: new AbortController(), paths: new Set(), full };
        runs.add(run);
        if (full) {
            if (latestFull && latestFull.paths.size === 0) latestFull.controller.abort();
            latestFull = run;
        }
        for (const path of paths) {
            clearTimer(path);
            claim(run, path);
        }
        const validatingFields = { ...state.validatingFields };
        for (const path of paths) validatingFields[path] = true;
        set({ validatingFields });

        const values = state.values;
        const signal = run.controller.signal;
        const work = (async () => {
            const [fieldErrors, resolved, crossErrors] = await Promise.all([
                Promise.all(paths.map(async (path) => [path, await runRules(path, run, values)] as const)),
                options.resolver ? Promise.resolve(options.resolver(values, { signal, fields: full ? undefined : paths })) : undefined,
                options.validate ? Promise.resolve(options.validate(values, { signal, messages: messages() })).then((errors) => normalizeErrors(errors || undefined)) : undefined
            ]);
            return { fieldErrors, resolved, crossErrors };
        })();
        for (const path of paths) current.set(path, work);

        let outcome: Awaited<typeof work>;
        try {
            outcome = await work;
        } catch (error) {
            finish(run);
            if (isAbort(error) || signal.aborted) return { valid: state.valid, errors: state.errors, values: state.values };
            throw error;
        }
        finish(run);

        const found = mergeErrors(
            Object.fromEntries(outcome.fieldErrors.filter(([, list]) => list.length)),
            outcome.resolved?.errors ? normalizeErrors(outcome.resolved.errors as ErrorsInput) : {},
            outcome.crossErrors ?? {}
        );

        const fullCurrent = full && latestFull === run;
        const mine = (path: string) => latest.get(path) === run;
        // A path nobody claimed (an error only the resolver knows about) is written unless something newer was.
        const free = (path: string) => !latest.has(path) && (applied.get(path) ?? 0) <= run.id;
        const errors: FormErrors = {};
        const validated: Record<string, true> = { ...state.validated };
        const write = (path: string) => {
            if (found[path]?.length) errors[path] = found[path]!;
            validated[path] = true;
            applied.set(path, run.id);
            checkedWith.set(path, values);
        };
        if (fullCurrent) {
            // A full run is the truth for every path, except those something newer has written or claimed.
            const touchedPaths = new Set([...paths, ...Object.keys(found), ...Object.keys(state.errors)]);
            for (const path of touchedPaths) {
                if (mine(path) || free(path)) write(path);
                else if (state.errors[path]) errors[path] = state.errors[path]!;
            }
        } else {
            Object.assign(errors, state.errors);
            for (const path of paths) {
                if (!mine(path)) continue;
                delete errors[path];
                write(path);
            }
        }
        for (const path of paths) if (mine(path)) latest.delete(path);
        if (latestFull === run) latestFull = null;

        set({ errors, validated });
        const valid = full ? Object.keys(errors).length === 0 : paths.every((path) => !errors[path]?.length);
        return { valid, errors, values: (outcome.resolved?.values as Values | undefined) ?? state.values };
    }

    async function settled(path: string): Promise<boolean> {
        let seen: Promise<unknown> | undefined;
        while (current.get(path) !== seen) {
            seen = current.get(path);
            try {
                await seen;
            } catch {
                // The run that failed reports it to its own caller.
            }
        }
        return !state.errors[path]?.length;
    }

    function schedule(paths: string[], trigger: ValidationTrigger): Promise<boolean> | undefined {
        if (!paths.length || destroyed) return undefined;
        const now: string[] = [];
        const waits: Promise<boolean>[] = [];
        for (const path of paths) {
            const delay = fieldOption(path, 'debounce') ?? options.debounce ?? 0;
            if (trigger === 'input' && delay > 0) {
                const previous = timers.get(path);
                if (previous !== undefined) clearTimeout(previous);
                if (!gates.has(path)) {
                    // Until the timer fires, whoever waits on the field waits on the timer.
                    let release!: () => void;
                    current.set(path, new Promise<void>((resolve) => (release = resolve)));
                    gates.set(path, release);
                }
                timers.set(
                    path,
                    setTimeout(() => {
                        timers.delete(path);
                        const release = gates.get(path);
                        gates.delete(path);
                        void execute([path], false)
                            .catch(report)
                            .finally(() => release?.());
                    }, delay)
                );
                waits.push(settled(path));
            } else now.push(path);
        }
        if (now.length) {
            const done = execute(now, false);
            waits.push(done.then((result) => now.every((path) => !result.errors[path]?.length)));
        }
        return Promise.all(waits).then((list) => list.every(Boolean));
    }

    function afterChange(path: string, trigger: 'input' | 'change'): Promise<boolean> | undefined {
        const targets = new Set<string>();
        for (const field of known()) {
            if (isPathWithin(path, field)) {
                if (shouldValidate(field, trigger)) targets.add(field);
            } else if (isPathWithin(field, path)) {
                // Inside a list that changed: only what was already checked is checked again.
                if (state.validated[field] && shouldValidate(field, trigger)) targets.add(field);
            } else if (state.validated[field] && (depsOf(field).some((dep) => isPathWithin(path, dep) || isPathWithin(dep, path)) || options.resolver || options.validate)) {
                // A field that reads the changed one, or any validated field when a whole-form check could involve it.
                if (shouldValidate(field, trigger)) targets.add(field);
            }
        }
        // A path no field registered for (a resolver-only form) still follows its own mode.
        if (!targets.has(path) && !entries.has(path) && (options.resolver || options.validate) && shouldValidate(path, trigger)) targets.add(path);
        return schedule([...targets], trigger);
    }

    // ------------------------------------------------------------ meta

    function remapMeta(arrayPath: string, map: (index: number) => number) {
        const prefix = `${arrayPath}.`;
        const remap = <T>(record: Readonly<Record<string, T>>): Record<string, T> => {
            const out: Record<string, T> = {};
            for (const [key, value] of Object.entries(record)) {
                if (!key.startsWith(prefix)) {
                    out[key] = value;
                    continue;
                }
                const [head, ...rest] = key.slice(prefix.length).split('.');
                const index = Number(head);
                if (!Number.isInteger(index)) {
                    out[key] = value;
                    continue;
                }
                const next = map(index);
                if (next < 0) continue;
                out[[arrayPath, next, ...rest].join('.')] = value;
            }
            return out;
        };
        // Validations running under the array would land on the wrong item; drop them.
        for (const [path, run] of [...latest]) {
            if (!path.startsWith(prefix)) continue;
            latest.delete(path);
            run.paths.delete(path);
            if (run.paths.size === 0 && run !== latestFull) run.controller.abort();
        }
        for (const path of [...timers.keys()]) if (path.startsWith(prefix)) clearTimer(path);
        return {
            errors: remap(state.errors),
            touched: remap(state.touched) as Record<string, true>,
            validated: remap(state.validated) as Record<string, true>,
            validatingFields: without(state.validatingFields, (key) => key.startsWith(prefix)) as Record<string, true>
        };
    }

    function clearMeta(path: string) {
        const match = (key: string) => key === path;
        set({
            errors: without(state.errors, match),
            touched: without(state.touched as Record<string, true>, match),
            validated: without(state.validated as Record<string, true>, match)
        });
    }

    // ------------------------------------------------------------ api

    const api: FormApi<Values> = {
        getState: () => state,
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        setOptions(next) {
            options = { ...options, ...next };
        },
        get messages() {
            return messages();
        },

        getValues: () => state.values,
        getValue: <T>(path: string) => getIn(state.values, path) as T,
        setValue(path, value, opts = {}) {
            const key = toPath(path);
            if (Object.is(getIn(state.values, key), value)) {
                if (opts.touch) api.touch(key);
                return;
            }
            set({ values: setIn(state.values, parsePath(key), value) });
            if (opts.touch) api.touch(key);
            const trigger = opts.trigger === undefined ? 'input' : opts.trigger;
            if (trigger) void afterChange(key, trigger)?.catch(report);
        },
        setValues(values, opts = {}) {
            if (values === state.values) return;
            const previous = state.values;
            set({ values });
            const trigger = opts.trigger === undefined ? false : opts.trigger;
            if (!trigger) return;
            const changed = known().filter((path) => !isEqual(getIn(previous, path), getIn(values, path)));
            for (const path of changed) void afterChange(path, trigger)?.catch(report);
        },

        getField(path) {
            const key = toPath(path);
            const errors = state.errors[key] ?? [];
            const value = getIn(state.values, key);
            const initialValue = getIn(state.initialValues, key);
            const validated = !!state.validated[key];
            return {
                path: key,
                value,
                initialValue,
                errors,
                error: errors[0],
                touched: !!state.touched[key],
                dirty: !isEqual(value, initialValue),
                validated,
                validating: !!state.validatingFields[key] || timers.has(key),
                invalid: validated && errors.length > 0,
                required: api.isRequired(key)
            };
        },
        getErrors(path) {
            if (path === undefined) return Object.values(state.errors).flat();
            return state.errors[toPath(path)] ?? [];
        },
        getError: (path) => state.errors[toPath(path)]?.[0],
        setError(path, message) {
            const key = toPath(path);
            const list = asList(message as string | readonly string[] | undefined).filter(Boolean);
            const errors = { ...state.errors };
            if (list.length) errors[key] = [...list];
            else delete errors[key];
            applied.set(key, ++runSeed);
            set({ errors, validated: { ...state.validated, [key]: true } });
        },
        setErrors(input, opts = {}) {
            const found = normalizeErrors(input);
            const validated: Record<string, true> = { ...state.validated };
            const id = ++runSeed;
            for (const key of Object.keys(found)) {
                validated[key] = true;
                applied.set(key, id);
            }
            set({ errors: opts.replace ? found : { ...state.errors, ...found }, validated });
        },
        clearErrors(path) {
            if (path === undefined) set({ errors: {} });
            else {
                const key = toPath(path);
                set({ errors: without(state.errors, (k) => isPathWithin(k, key)) });
            }
        },
        isDirty(path) {
            if (path === undefined) return state.dirty;
            return !isEqual(getIn(state.values, path), getIn(state.initialValues, path));
        },
        touch(path, touched = true) {
            const key = toPath(path);
            if (!!state.touched[key] === touched) return;
            set({ touched: touched ? { ...state.touched, [key]: true } : without(state.touched as Record<string, true>, (k) => k === key) });
        },
        blur(path) {
            const key = toPath(path);
            api.touch(key);
            // A debounced validation waiting on this field runs now.
            if (timers.has(key)) return schedule([key], 'blur');
            return shouldValidate(key, 'blur') && !upToDate(key) ? schedule([key], 'blur') : undefined;
        },
        commit(path) {
            const key = toPath(path);
            if (timers.has(key)) return schedule([key], 'change');
            return shouldValidate(key, 'change') && !upToDate(key) ? schedule([key], 'change') : undefined;
        },

        register(path, fieldOptions = {}) {
            const key = toPath(path);
            const entry: Entry = { options: fieldOptions };
            let set_ = entries.get(key);
            if (!set_) entries.set(key, (set_ = new Set()));
            set_.add(entry);
            if (fieldOptions.initialValue !== undefined && getIn(state.values, key) === undefined) {
                set({ values: setIn(state.values, key, cloneValue(fieldOptions.initialValue)), initialValues: setIn(state.initialValues, key, cloneValue(fieldOptions.initialValue)) });
            }
            return {
                update(next) {
                    entry.options = next;
                },
                unregister() {
                    const list = entries.get(key);
                    if (!list?.delete(entry)) return;
                    if (list.size) return;
                    entries.delete(key);
                    // Components come and go within one render (a list reordering); forget the field only if nobody took its place.
                    queueMicrotask(() => {
                        if (entries.has(key) || destroyed || options.rules?.[key]) return;
                        const run = latest.get(key);
                        if (run) {
                            latest.delete(key);
                            run.paths.delete(key);
                            if (!run.paths.size && run !== latestFull) run.controller.abort();
                        }
                        clearTimer(key);
                        applied.delete(key);
                        checkedWith.delete(key);
                        clearMeta(key);
                        set({ validatingFields: without(state.validatingFields as Record<string, true>, (k) => k === key) });
                    });
                }
            };
        },
        fields: known,
        isRequired: (path) => rulesOf(toPath(path)).some((rule) => rule.isRequired),
        labelOf,

        async validate(paths, opts = {}) {
            if (paths === undefined) {
                const all = known();
                const result = await execute(all, true);
                const touched: Record<string, true> = { ...state.touched };
                for (const path of all) touched[path] = true;
                set({ touched });
                return result;
            }
            const list = asList(paths).map(toPath);
            await (opts.trigger && opts.trigger !== 'submit' ? schedule(list, opts.trigger) : execute(list, false));
            await Promise.all(list.map(settled));
            const errors = state.errors;
            return { valid: list.every((path) => !errors[path]?.length), errors, values: state.values };
        },
        async validateField(path, trigger = 'change') {
            const key = toPath(path);
            await (trigger === 'submit' ? execute([key], false) : schedule([key], trigger));
            return settled(key);
        },
        submit(onValid, onInvalid) {
            if (submitting) return submitting;
            const controller = new AbortController();
            set({ submitting: true, submitCount: state.submitCount + 1 });
            submitting = (async () => {
                try {
                    const result = await api.validate();
                    if (!result.valid) {
                        set({ submitting: false, submitted: false, submitFailed: true });
                        await (onInvalid ?? options.onInvalidSubmit)?.(result);
                        return result;
                    }
                    let reported = false;
                    const helpers: SubmitHelpers<Values> = {
                        setErrors(errors) {
                            reported = true;
                            api.setErrors(errors);
                        },
                        setError(path, message) {
                            reported = true;
                            api.setError(path, message);
                        },
                        reset: (values) => api.reset(values),
                        signal: controller.signal
                    };
                    try {
                        await (onValid ?? options.onSubmit)?.(result.values, helpers);
                    } catch (error) {
                        set({ submitting: false, submitted: false, submitFailed: true });
                        throw error;
                    }
                    const failed = reported && !state.valid;
                    if (state.submitting) set({ submitting: false, submitted: !failed, submitFailed: failed });
                    return failed ? { valid: false, errors: state.errors, values: result.values } : result;
                } finally {
                    if (state.submitting) set({ submitting: false });
                    submitting = null;
                }
            })();
            return submitting;
        },
        reset(values) {
            for (const run of runs) run.controller.abort();
            runs.clear();
            latest.clear();
            latestFull = null;
            for (const path of [...timers.keys()]) clearTimer(path);
            current.clear();
            applied.clear();
            checkedWith.clear();
            arrayKeys.clear();
            const nextInitial = values === undefined ? state.initialValues : cloneValue(values);
            set({
                values: cloneValue(nextInitial),
                initialValues: nextInitial,
                errors: {},
                touched: {},
                validated: {},
                validatingFields: {},
                submitting: false,
                submitted: false,
                submitFailed: false,
                submitCount: 0
            });
        },
        resetField(path, value) {
            const key = toPath(path);
            const nextInitial = value === undefined ? getIn(state.initialValues, key) : cloneValue(value);
            const inside = (k: string) => isPathWithin(k, key);
            set({
                values: setIn(state.values, key, cloneValue(nextInitial)),
                initialValues: value === undefined ? state.initialValues : setIn(state.initialValues, key, nextInitial),
                errors: without(state.errors, inside),
                touched: without(state.touched as Record<string, true>, inside),
                validated: without(state.validated as Record<string, true>, inside)
            });
        },

        array<Item>(path: string): FieldArrayApi<Item> {
            const key = toPath(path);
            const list = (): Item[] => {
                const value = getIn(state.values, key);
                return Array.isArray(value) ? (value as Item[]) : [];
            };
            const keysOf = (): string[] => {
                const length = list().length;
                let keys = arrayKeys.get(key) ?? [];
                if (keys.length !== length) {
                    keys = keys.slice(0, length);
                    while (keys.length < length) keys.push(`k${++keySeed}`);
                    arrayKeys.set(key, keys);
                }
                return keys;
            };
            // Applies a new list, and moves per-item state along with the items. `order[i]` is the old index now at `i`, or -1 for a new item.
            const apply = (next: Item[], order: number[]) => {
                const oldKeys = keysOf();
                const inverse = new Map<number, number>();
                order.forEach((old, i) => old >= 0 && inverse.set(old, i));
                const meta = remapMeta(key, (index) => inverse.get(index) ?? -1);
                arrayKeys.set(
                    key,
                    order.map((old) => (old >= 0 ? oldKeys[old]! : `k${++keySeed}`))
                );
                set({ values: setIn(state.values, key, next), ...meta });
                void afterChange(key, 'change')?.catch(report);
            };
            const indices = (n: number) => Array.from({ length: n }, (_, i) => i);
            return {
                keys: keysOf,
                append(...items) {
                    const items0 = list();
                    apply([...items0, ...items], [...indices(items0.length), ...items.map(() => -1)]);
                },
                prepend(...items) {
                    const items0 = list();
                    apply([...items, ...items0], [...items.map(() => -1), ...indices(items0.length)]);
                },
                insert(index, ...items) {
                    const items0 = list();
                    const at = Math.max(0, Math.min(index, items0.length));
                    const order = indices(items0.length);
                    apply([...items0.slice(0, at), ...items, ...items0.slice(at)], [...order.slice(0, at), ...items.map(() => -1), ...order.slice(at)]);
                },
                remove(index) {
                    const drop = new Set(asList(index as number | readonly number[]));
                    const items0 = list();
                    const order = indices(items0.length).filter((i) => !drop.has(i));
                    apply(order.map((i) => items0[i]!), order);
                },
                move(from, to) {
                    const items0 = list();
                    if (from === to || from < 0 || from >= items0.length) return;
                    const order = indices(items0.length);
                    const [moved] = order.splice(from, 1);
                    order.splice(Math.max(0, Math.min(to, items0.length - 1)), 0, moved!);
                    apply(order.map((i) => items0[i]!), order);
                },
                swap(a, b) {
                    const items0 = list();
                    if (a === b || a < 0 || b < 0 || a >= items0.length || b >= items0.length) return;
                    const order = indices(items0.length);
                    order[a] = b;
                    order[b] = a;
                    apply(order.map((i) => items0[i]!), order);
                },
                replace(items) {
                    arrayKeys.delete(key);
                    apply([...items], items.map(() => -1));
                }
            };
        },
        destroy() {
            destroyed = true;
            for (const run of runs) run.controller.abort();
            for (const path of [...timers.keys()]) clearTimer(path);
            listeners.clear();
        }
    };
    return api;
}

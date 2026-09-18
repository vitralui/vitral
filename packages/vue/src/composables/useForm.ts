import {
    createForm,
    type FieldArrayApi,
    type FieldOptions,
    type FormApi,
    type FormOptions,
    type FormState,
    type FormValues,
    type ValidationResult,
    type ValidateOn
} from '@vitral/forms';
import { computed, getCurrentScope, hasInjectionContext, nextTick, onScopeDispose, ref, shallowRef, type ComputedRef, type WritableComputedRef } from 'vue';
import type { PassThrough } from '../base/types';
import { useVitral } from '../config/config';
import type { FormContext, FormFieldEntry } from '../components/Form/context';
import type { FormErrorRelation, FormSubmitEvent } from '../components/Form/types';

const FORM_HANDLE = Symbol('vt-form-handle');

export type UseFormOptions<Values extends FormValues = FormValues> = FormOptions<Values>;

export interface UseFieldReturn<T = unknown> {
    /** The value; writing it counts as typing (`input`). */
    value: WritableComputedRef<T>;
    error: ComputedRef<string | undefined>;
    errors: ComputedRef<string[]>;
    /** Validated and wrong. */
    invalid: ComputedRef<boolean>;
    touched: ComputedRef<boolean>;
    dirty: ComputedRef<boolean>;
    validating: ComputedRef<boolean>;
    setValue(value: T, trigger?: 'input' | 'change'): void;
    /** Call from the control's blur. */
    onBlur(): void;
    validate(): Promise<boolean>;
    /** Spread on a native control: `v-bind="attrs"`. */
    attrs: ComputedRef<{ name: string; 'aria-invalid'?: 'true' }>;
}

export interface UseFormReturn<Values extends FormValues = FormValues> extends FormContext<Values> {
    values: ComputedRef<Values>;
    errors: ComputedRef<Record<string, string[]>>;
    valid: ComputedRef<boolean>;
    dirty: ComputedRef<boolean>;
    submitting: ComputedRef<boolean>;
    submitted: ComputedRef<boolean>;
    submitFailed: ComputedRef<boolean>;
    submitCount: ComputedRef<number>;
    validating: ComputedRef<boolean>;
    getValue<T = unknown>(path: string): T;
    setValue(path: string, value: unknown, options?: { trigger?: 'input' | 'change' | false }): void;
    setValues(values: Values): void;
    setErrors: FormApi<Values>['setErrors'];
    setError: FormApi<Values>['setError'];
    clearErrors: FormApi<Values>['clearErrors'];
    validate: FormApi<Values>['validate'];
    validateField: FormApi<Values>['validateField'];
    resetField: FormApi<Values>['resetField'];
    array<Item = unknown>(path: string): FieldArrayApi<Item>;
    /** An event handler for a `<form>` of your own: prevents the default, validates, and calls `onValid` with the values. */
    handleSubmit(onValid?: (values: Values, event: FormSubmitEvent<Values>) => unknown, onInvalid?: (result: ValidationResult<Values>) => unknown): (event?: Event) => Promise<ValidationResult<Values>>;
    /** Binds one path for a control of your own, registering it (with `options`) for as long as the calling scope lives. */
    field<T = unknown>(name: string, options?: FieldOptions & { validateOn?: ValidateOn | ValidateOn[] }): UseFieldReturn<T>;
    readonly [FORM_HANDLE]: true;
}

/** Whether a value is what `useForm()` returns — what `Form.Root`'s `form` prop takes. */
export function isFormHandle(value: unknown): value is UseFormReturn {
    return !!value && typeof value === 'object' && (value as Record<symbol, unknown>)[FORM_HANDLE] === true;
}

/**
 * A form: values, validation and submission, reactive. Pass it to
 * `<Form.Root :form="form">` to drive the parts from the script, or use it on
 * its own for an interface of your own — `field()` binds a control,
 * `handleSubmit()` handles a native `<form>`.
 *
 * ```ts
 * const form = useForm({ initialValues: { email: '' }, rules: { email: [rules.required(), rules.email()] } });
 * const email = form.field<string>('email');
 * const onSubmit = form.handleSubmit((values) => save(values));
 * ```
 *
 * Messages come from the Vitral locale's `form` group unless `messages` is given.
 */
export function useForm<Values extends FormValues = FormValues>(options: UseFormOptions<Values> = {}): UseFormReturn<Values> {
    const config = hasInjectionContext() ? useVitral().config : null;
    const form = createForm<Values>({ ...options, messages: options.messages ?? (config ? () => config.locale.form : undefined) });
    const state = shallowRef<FormState<Values>>(form.getState());
    const stop = form.subscribe((next) => (state.value = next));

    const entries = shallowRef<FormFieldEntry[]>([]);
    const quiet = ref<ReadonlySet<string>>(new Set());
    const summaryVisible = ref(false);
    const summaries = ref<HTMLElement[]>([]);
    let disabledSource: () => boolean = () => false;
    let relationSource: () => FormErrorRelation = () => 'both';
    let focusSource: () => boolean = () => true;
    let unstyledSource: () => boolean | undefined = () => undefined;
    let ptSource: () => PassThrough | undefined = () => undefined;
    const sources = ref(0);

    if (getCurrentScope()) {
        onScopeDispose(() => {
            stop();
            form.destroy();
        });
    }

    function focusFirstInvalid() {
        void nextTick(() => {
            const summary = summaries.value.find((el) => el.isConnected);
            if (summary) {
                summary.focus();
                return;
            }
            const errors = state.value.errors;
            const invalid = entries.value.filter((entry) => errors[entry.name()]?.length && entry.element()?.isConnected);
            invalid.sort((a, b) => (a.element()!.compareDocumentPosition(b.element()!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
            invalid[0]?.focus();
        });
    }

    function silenceAll() {
        quiet.value = new Set([...form.fields(), ...entries.value.map((entry) => entry.name()), ...Object.keys(state.value.errors)]);
    }

    const ctx = {
        form,
        state,
        entries,
        quiet,
        summaryVisible,
        summaries,
        disabled: computed(() => (void sources.value, disabledSource())),
        errorRelation: computed(() => (void sources.value, relationSource())),
        focusOnInvalid: computed(() => (void sources.value, focusSource())),
        unstyled: () => unstyledSource(),
        pt: () => ptSource(),
        registerEntry(entry: FormFieldEntry) {
            entries.value = [...entries.value, entry];
            return () => {
                entries.value = entries.value.filter((e) => e !== entry);
            };
        },
        release(name: string) {
            if (!quiet.value.has(name)) return;
            const next = new Set(quiet.value);
            next.delete(name);
            quiet.value = next;
        },
        async submit(originalEvent?: Event, handlers: ((event: FormSubmitEvent<Values>) => unknown)[] = [], onInvalid?: (result: ValidationResult<Values>) => unknown) {
            silenceAll();
            let invalidHandled = false;
            const result = await form.submit(
                async (values, helpers) => {
                    const event: FormSubmitEvent<Values> = {
                        valid: true,
                        values,
                        errors: {},
                        originalEvent,
                        setErrors: (errors) => helpers.setErrors(errors as never),
                        setError: helpers.setError,
                        reset: helpers.reset
                    };
                    await Promise.all(handlers.map((handler) => handler(event)));
                    await options.onSubmit?.(values, helpers);
                },
                async (outcome) => {
                    invalidHandled = true;
                    summaryVisible.value = true;
                    const event: FormSubmitEvent<Values> = {
                        valid: false,
                        values: outcome.values,
                        errors: outcome.errors,
                        originalEvent,
                        setErrors: (errors) => form.setErrors(errors as never),
                        setError: form.setError,
                        reset: (values) => ctx.reset(values)
                    };
                    if (focusSource()) focusFirstInvalid();
                    await Promise.all(handlers.map((handler) => handler(event)));
                    await onInvalid?.(outcome);
                    await options.onInvalidSubmit?.(outcome);
                }
            );
            if (result.valid) summaryVisible.value = false;
            else if (!invalidHandled) {
                // The handler reported errors from the server.
                summaryVisible.value = true;
                if (focusSource()) focusFirstInvalid();
            }
            return result;
        },
        reset(values?: Values) {
            form.reset(values);
            summaryVisible.value = false;
            quiet.value = new Set();
        },
        focusFirstInvalid,
        fieldState: (name: string) => (void state.value, form.getField(name)),
        setDisabled(source: () => boolean) {
            disabledSource = source;
            sources.value++;
        },
        setErrorRelation(source: () => FormErrorRelation) {
            relationSource = source;
            sources.value++;
        },
        setFocusOnInvalid(source: () => boolean) {
            focusSource = source;
            sources.value++;
        },
        setStyling(unstyled: () => boolean | undefined, pt: () => PassThrough | undefined) {
            unstyledSource = unstyled;
            ptSource = pt;
            sources.value++;
        }
    };

    const handle: UseFormReturn<Values> = {
        ...ctx,
        values: computed(() => state.value.values),
        errors: computed(() => state.value.errors),
        valid: computed(() => state.value.valid),
        dirty: computed(() => state.value.dirty),
        submitting: computed(() => state.value.submitting),
        submitted: computed(() => state.value.submitted),
        submitFailed: computed(() => state.value.submitFailed),
        submitCount: computed(() => state.value.submitCount),
        validating: computed(() => state.value.validating),
        getValue: <T>(path: string) => (void state.value, form.getValue<T>(path)),
        setValue: (path, value, opts) => form.setValue(path, value, opts),
        setValues: (values) => form.setValues(values),
        setErrors: (errors, opts) => form.setErrors(errors, opts),
        setError: (path, message) => form.setError(path, message),
        clearErrors: (path) => form.clearErrors(path),
        validate: (paths, opts) => form.validate(paths, opts),
        validateField: (path, trigger) => form.validateField(path, trigger),
        resetField: (path, value) => form.resetField(path, value),
        array: <Item>(path: string) => form.array<Item>(path),
        handleSubmit(onValid, onInvalid) {
            return (event?: Event) => {
                event?.preventDefault?.();
                return ctx.submit(event, onValid ? [(e) => (e.valid ? onValid(e.values, e) : undefined)] : [], onInvalid);
            };
        },
        field<T>(name: string, fieldOptions: FieldOptions = {}): UseFieldReturn<T> {
            const registration = form.register(name, fieldOptions);
            if (getCurrentScope()) onScopeDispose(() => registration.unregister());
            const snapshot = computed(() => (void state.value, form.getField(name)));
            return {
                value: computed({
                    get: () => snapshot.value.value as T,
                    set: (value) => {
                        ctx.release(name);
                        form.setValue(name, value, { trigger: 'input' });
                    }
                }),
                error: computed(() => (snapshot.value.invalid ? snapshot.value.error : undefined)),
                errors: computed(() => (snapshot.value.invalid ? snapshot.value.errors : [])),
                invalid: computed(() => snapshot.value.invalid),
                touched: computed(() => snapshot.value.touched),
                dirty: computed(() => snapshot.value.dirty),
                validating: computed(() => snapshot.value.validating),
                setValue: (value, trigger = 'input') => {
                    ctx.release(name);
                    form.setValue(name, value, { trigger });
                },
                onBlur: () => {
                    ctx.release(name);
                    void form.blur(name);
                },
                validate: () => form.validateField(name, 'submit'),
                attrs: computed(() => ({ name, 'aria-invalid': snapshot.value.invalid ? ('true' as const) : undefined }))
            };
        },
        [FORM_HANDLE]: true
    };
    return handle;
}

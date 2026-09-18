import type { FieldOptions, FieldSnapshot, FormApi, FormState, FormValues, ValidationResult } from '@vitral/forms';
import { inject, type ComputedRef, type InjectionKey, type Ref, type ShallowRef } from 'vue';
import type { BaseProps, PassThrough } from '../../base/types';
import type { FormErrorRelation, FormSubmitEvent } from './types';

/** What a field on the page tells its form, so the summary can link to it and a failed submit can focus it. */
export interface FormFieldEntry {
    name: () => string;
    element: () => HTMLElement | null;
    controlId: () => string;
    label: () => string;
    focus: () => void;
}

/**
 * The form a `Form.Root` (or `useForm()`) owns, as its parts and composables
 * see it: the framework-free form, its state as a reactive value, and the
 * wiring between the parts.
 */
export interface FormContext<Values extends FormValues = FormValues> {
    /** The framework-free form from `@vitral/forms`. */
    form: FormApi<Values>;
    /** The form's state; replaced on every change, so a computed that reads it follows. */
    state: Readonly<ShallowRef<FormState<Values>>>;
    /** Fields rendered on the page, in registration order. */
    entries: ShallowRef<FormFieldEntry[]>;
    /** Paths whose inline error should not be announced (a submit just revealed it; the summary or focus speaks for it). */
    quiet: Ref<ReadonlySet<string>>;
    /** Whether the error summary is showing: from a failed submit until a successful one or a reset. */
    summaryVisible: Ref<boolean>;
    summaries: Ref<HTMLElement[]>;
    disabled: ComputedRef<boolean>;
    errorRelation: ComputedRef<FormErrorRelation>;
    focusOnInvalid: ComputedRef<boolean>;
    unstyled: () => boolean | undefined;
    pt: () => PassThrough | undefined;
    registerEntry(entry: FormFieldEntry): () => void;
    /** The user acted on a field: its error may be announced again. */
    release(name: string): void;
    /** Validates and submits; `handlers` receive the submit event, and their promises are awaited. */
    submit(originalEvent?: Event, handlers?: ((event: FormSubmitEvent<Values>) => unknown)[], onInvalid?: (result: ValidationResult<Values>) => unknown): Promise<ValidationResult<Values>>;
    reset(values?: Values): void;
    /** Focuses the summary, or the first invalid field on the page. */
    focusFirstInvalid(): void;
    fieldState(name: string): FieldSnapshot;
    setDisabled(source: () => boolean): void;
    setErrorRelation(source: () => FormErrorRelation): void;
    setFocusOnInvalid(source: () => boolean): void;
    setStyling(unstyled: () => boolean | undefined, pt: () => PassThrough | undefined): void;
}

export const FormKey: InjectionKey<FormContext> = Symbol('vt-form');

/** What a `Form.Field` (or `Form.FieldArray`) shares with the label, hint and message inside it. */
export interface FieldContext {
    name: ComputedRef<string>;
    state: ComputedRef<FieldSnapshot>;
    ids: { readonly control: string; readonly label: string; readonly description: string; readonly message: string };
    /** The label text for the summary and for messages that name the field. */
    labelText: () => string;
    /** The field's `label` prop, for a `Form.Label` with no content. */
    labelProp: () => string | undefined;
    /** The field's `description` prop, for a `Form.Description` with no content. */
    descriptionProp: () => string | undefined;
    /** Whether a `<label for>` can name the control (a native control has the control's id). */
    labelable: Ref<boolean>;
    /** Several controls answer one question: the field element is the group. */
    group: Ref<boolean>;
    /** Parts placed inside, by kind — the automatic ones do not count. */
    parts: { label: number; description: number; message: number };
    registerPart(kind: 'label' | 'description' | 'message', element?: () => HTMLElement | null): () => void;
    /** The error is not to be announced right now. */
    quiet: ComputedRef<boolean>;
    focus(): void;
    setValue(value: unknown, trigger?: 'input' | 'change'): void;
    blur(): void;
    unstyled: () => boolean | undefined;
    pt: () => PassThrough | undefined;
}

export const FieldKey: InjectionKey<FieldContext> = Symbol('vt-form-field');

/** The keys the field gives the parts it renders by itself, so they do not count as placed. */
export const AUTO_PARTS = { label: Symbol('vt-form-auto-label'), description: Symbol('vt-form-auto-description'), message: Symbol('vt-form-auto-message') } as const;

export function isAutoPart(key: unknown): boolean {
    return key === AUTO_PARTS.label || key === AUTO_PARTS.description || key === AUTO_PARTS.message;
}

export function useFormContext(part: string): FormContext {
    const ctx = inject(FormKey, null);
    if (!ctx) throw new Error(`<${part}> must be placed inside <FormRoot> (Form.Root).`);
    return ctx;
}

export function useFieldContext(part: string): FieldContext {
    const ctx = inject(FieldKey, null);
    if (!ctx) throw new Error(`<${part}> must be placed inside <FormField> (Form.Field) or <FormFieldArray>.`);
    return ctx;
}

/** A part's props with `unstyled` and `pt` falling back to the root's, as the Editor's parts do. */
export function inheritRoot<P extends BaseProps>(props: P, source: { unstyled: () => boolean | undefined; pt: () => PassThrough | undefined }): P {
    return new Proxy(props, {
        get(target, key) {
            if (key === 'unstyled') return target.unstyled ?? source.unstyled();
            if (key === 'pt') {
                const inherited = source.pt();
                return inherited ? { ...inherited, ...target.pt } : target.pt;
            }
            return Reflect.get(target, key);
        }
    });
}

export type { FieldOptions };

import type { ComputedRef, InjectionKey } from 'vue';

/** What a RadioGroup hands the RadioButtons inside it. */
export interface RadioGroupContext {
    /** Shared by every radio, which is what makes the browser move between them with the arrow keys. */
    name: ComputedRef<string>;
    modelValue: ComputedRef<unknown>;
    disabled: ComputedRef<boolean>;
    invalid: ComputedRef<boolean>;
    size: ComputedRef<'small' | 'large' | undefined>;
    select(value: unknown, event: Event): void;
}

export const RadioGroupKey: InjectionKey<RadioGroupContext> = Symbol('vt-radiogroup');

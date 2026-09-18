import type { ComputedRef, InjectionKey, Ref } from 'vue';
import type { BaseProps } from '../../base/types';
import type { StepValue } from './types';

export interface StepEntry {
    value: () => StepValue | undefined;
    el: Ref<HTMLElement | null>;
}

export interface StepperContext {
    unstyled: () => boolean | undefined;
    active: ComputedRef<StepValue | undefined>;
    linear: () => boolean;
    select(value: StepValue): void;
    register(entry: StepEntry): () => void;
    /** The step's place in reading order, from 0; -1 when unknown. */
    indexOf(value: StepValue | undefined): number;
    count: ComputedRef<number>;
    /** Whether a step can be chosen: any, or in linear mode those up to the current one. */
    reachable(value: StepValue | undefined): boolean;
    move(from: StepEntry, to: 'next' | 'previous' | 'first' | 'last'): void;
    stepId(value: StepValue | undefined): string;
    panelId(value: StepValue | undefined): string;
}

export const StepperKey: InjectionKey<StepperContext> = Symbol('vt-stepper');

/** The value a StepItem hands the Step and StepPanel inside it. */
export const StepItemKey: InjectionKey<{ value: () => StepValue }> = Symbol('vt-step-item');

/** A part's props with `unstyled` falling back to the Stepper's. */
export function inheritUnstyled<P extends BaseProps>(props: P, parent: StepperContext | null | undefined): P {
    return new Proxy(props, {
        get: (target, key) => (key === 'unstyled' ? (target.unstyled ?? parent?.unstyled()) : Reflect.get(target, key))
    });
}

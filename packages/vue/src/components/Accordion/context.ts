import type { RovingMove } from '@vitral/core';
import type { ComputedRef, InjectionKey, Ref } from 'vue';
import type { BaseProps, IconProp } from '../../base/types';
import type { AccordionPanelValue } from './types';

export interface AccordionContext {
    unstyled: () => boolean | undefined;
    lazy: () => boolean;
    headingLevel: () => number;
    expandIcon: () => IconProp | undefined;
    collapseIcon: () => IconProp | undefined;
    isOpen(value: AccordionPanelValue): boolean;
    toggle(value: AccordionPanelValue): void;
    /** Adds a header button to the arrow-key order; returns the function that removes it. */
    register(button: Ref<HTMLButtonElement | null>): () => void;
    /** Moves focus from one header button to another. */
    move(from: HTMLButtonElement, move: RovingMove): void;
}

export interface AccordionPanelContext {
    id: string;
    value: () => AccordionPanelValue;
    disabled: () => boolean;
    open: ComputedRef<boolean>;
}

export const AccordionKey: InjectionKey<AccordionContext> = Symbol('vt-accordion');
export const AccordionPanelKey: InjectionKey<AccordionPanelContext> = Symbol('vt-accordion-panel');

/** A part's props with `unstyled` falling back to the accordion's, so one switch on the accordion covers every part. */
export function inheritUnstyled<P extends BaseProps>(props: P, parent: AccordionContext | null | undefined): P {
    return new Proxy(props, {
        get: (target, key) => (key === 'unstyled' ? (target.unstyled ?? parent?.unstyled()) : Reflect.get(target, key))
    });
}

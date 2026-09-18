import type { RovingMove } from '@vitral/core';
import type { ComputedRef, InjectionKey, Ref } from 'vue';
import type { BaseProps } from '../../base/types';
import type { TabValue } from './types';

export interface TabEntry {
    value: () => TabValue;
    disabled: () => boolean;
    el: Ref<HTMLElement | null>;
}

export interface TabsContext {
    unstyled: () => boolean | undefined;
    orientation: () => 'horizontal' | 'vertical';
    lazy: () => boolean;
    /** The selected value: the model, or the first enabled tab while the model is empty. */
    active: ComputedRef<TabValue | undefined>;
    /** The tab that is in the tab order: the selected one, or the first enabled one. */
    tabStop: ComputedRef<TabValue | undefined>;
    /** The selected tab's element, which the indicator follows. */
    activeElement: () => HTMLElement | null;
    select(value: TabValue): void;
    register(entry: TabEntry): () => void;
    /** Moves focus from one tab to another by the arrow-key rules, selecting it when activation is automatic. */
    move(from: TabEntry, move: RovingMove): void;
    tabId(value: TabValue): string;
    panelId(value: TabValue): string;
}

export const TabsKey: InjectionKey<TabsContext> = Symbol('vt-tabs');

/** A part's props with `unstyled` falling back to the Tabs', so one switch covers every part. */
export function inheritUnstyled<P extends BaseProps>(props: P, parent: TabsContext | null | undefined): P {
    return new Proxy(props, {
        get: (target, key) => (key === 'unstyled' ? (target.unstyled ?? parent?.unstyled()) : Reflect.get(target, key))
    });
}

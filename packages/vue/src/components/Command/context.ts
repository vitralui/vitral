import type { ComputedRef, InjectionKey, Ref } from 'vue';
import type { BaseProps } from '../../base/types';

export interface CommandItemEntry {
    id: string;
    value: () => string;
    keywords: () => string[];
    disabled: () => boolean;
    forceMount: () => boolean;
    groupId: string | null;
    el: Ref<HTMLElement | null>;
    onSelect: () => void;
}

export interface CommandContext {
    unstyled: () => boolean | undefined;
    search: Ref<string>;
    listId: string;
    inputId: string;
    activeId: Ref<string | null>;
    /** Whether an item passes the search. */
    visible(entry: CommandItemEntry): boolean;
    /** Whether a group has an item that passes it. */
    groupVisible(groupId: string): boolean;
    /** How many items pass it. */
    count: ComputedRef<number>;
    register(entry: CommandItemEntry): () => void;
    onKeydown(event: KeyboardEvent): void;
    select(entry: CommandItemEntry): void;
    label: () => string;
}

export const CommandKey: InjectionKey<CommandContext> = Symbol('vt-command');
export const CommandGroupKey: InjectionKey<{ id: string }> = Symbol('vt-command-group');

/** A part's props with `unstyled` falling back to the Command's. */
export function inheritUnstyled<P extends BaseProps>(props: P, parent: CommandContext | null | undefined): P {
    return new Proxy(props, {
        get: (target, key) => (key === 'unstyled' ? (target.unstyled ?? parent?.unstyled()) : Reflect.get(target, key))
    });
}

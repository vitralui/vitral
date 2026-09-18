import type { InjectionKey } from 'vue';

export interface IconFieldContext {
    unstyled: () => boolean | undefined;
}

export const IconFieldKey: InjectionKey<IconFieldContext> = Symbol('vt-iconfield');

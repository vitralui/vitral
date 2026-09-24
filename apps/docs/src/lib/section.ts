import type { InjectionKey, Ref } from 'vue';
import type { DemoSource } from './source';

/**
 * A page hands its demo sections their own markup; the sections ask for it by
 * title. It is a ref because the page it belongs to changes under them as the
 * reader moves from component to component.
 */
export const demoSourcesKey: InjectionKey<Ref<Map<string, DemoSource>>> = Symbol('vitral-demo-sources');

export function slugify(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^\w]+/g, '-')
        .replace(/^-|-$/g, '');
}

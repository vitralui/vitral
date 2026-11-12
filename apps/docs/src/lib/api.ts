import { shallowReactive } from 'vue';
import { lookup } from './i18n';
import { once } from './lazy';
import sharedTypes from '../../../../packages/vue/src/base/types.ts?raw';
import { parseApi, type ApiDoc, type ApiMember } from '../../../../scripts/api-members';

/**
 * The API tables are read from the components' own `types.ts` at build time,
 * not written by hand: a prop that is renamed in the library is renamed in the
 * documentation, and one that is added without a doc comment shows up as a
 * gap worth filling. The reading itself is `scripts/api-members.ts`, which the
 * history of each release's changes is made with too.
 */
export type { ApiDoc, ApiMember } from '../../../../scripts/api-members';

// One small chunk per component, fetched when its page is opened.
const raw = import.meta.glob<string>('../../../../packages/vue/src/components/*/types.ts', { query: '?raw', import: 'default' });

const byComponent = new Map(Object.entries(raw).map(([path, load]) => [path.split('/').at(-2)!, once(load)]));
/** The `types.ts` that have arrived. Reactive, so a table that asked re-renders when its file does. */
const loaded = shallowReactive(new Map<string, string>());

/** Fetches a component's `types.ts`, if it has one and it has not been fetched already. */
export async function loadApi(component: string): Promise<void> {
    if (loaded.has(component)) return;
    const text = await byComponent.get(component)?.();
    if (text !== undefined) loaded.set(component, text);
}

/** A component's API, once its `types.ts` has arrived; asking starts the fetch. */
export function apiOf(component: string): ApiDoc | null {
    const source = loaded.get(component);
    if (source === undefined) {
        loadApi(component).catch(() => {});
        return null;
    }
    return parseApi(source, component, sharedTypes);
}

/**
 * A member's doc comment in the page's language. The comment in `types.ts` is
 * the English; a translation is `locales/<lang>/api/<component>.json`, by kind
 * and name: `{ "props": { "severity": "…" }, "emits": {}, "slots": {} }`.
 */
export function memberDoc(component: string, kind: 'props' | 'emits' | 'slots', member: ApiMember): string | undefined {
    return lookup(`api/${component.toLowerCase()}`, `${kind}.${member.name}`) ?? member.doc;
}

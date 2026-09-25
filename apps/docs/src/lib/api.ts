import { shallowReactive } from 'vue';
import { lookup } from './i18n';
import { once } from './lazy';

/**
 * The API tables are read from the components' own `types.ts` at build time,
 * not written by hand: a prop that is renamed in the library is renamed in the
 * documentation, and one that is added without a doc comment shows up as a
 * gap worth filling.
 */
export interface ApiMember {
    name: string;
    type: string;
    optional: boolean;
    doc?: string;
    default?: string;
}

export interface ApiDoc {
    props: ApiMember[];
    emits: ApiMember[];
    slots: ApiMember[];
    /** Interfaces the props extend. `BaseProps` carries `pt`, `dt`, `unstyled`. */
    extends: string[];
}

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

/** Members of one `{ … }` body: a name, a type that may run over lines, and the doc comment above it. */
function members(body: string): ApiMember[] {
    const out: ApiMember[] = [];
    let doc: string | undefined;
    let pending = '';

    for (const line of body.split('\n')) {
        const text = line.trim();
        if (!text) continue;

        if (text.startsWith('/**') || text.startsWith('*') || text.startsWith('*/')) {
            if (text.startsWith('/**')) doc = '';
            doc = `${doc ?? ''} ${text.replace(/^\/\*\*|^\*\/|^\*|\*\/$/g, '').trim()}`.trim();
            continue;
        }
        if (text.startsWith('//')) continue;

        pending += (pending ? ' ' : '') + text;
        // A type may run over several lines, as a union of string literals does.
        // The member is only complete once its line ends the declaration.
        if (!pending.endsWith(';')) continue;

        // Event names may be quoted, and a quoted one may hold a colon:
        // `'invalid-submit': [...]`, `'update:modelValue': [...]`.
        const match = pending.match(/^(?:'([^']+)'|"([^"]+)"|([\w$-]+))(\?)?:\s*([\s\S]*);$/);
        pending = '';
        if (!match) continue;

        out.push({ name: (match[1] ?? match[2] ?? match[3])!, optional: Boolean(match[4]), type: match[5]!.replace(/\s+/g, ' '), doc: doc || undefined });
        doc = undefined;
    }
    return out;
}

/** The body of `export (interface|type) <name>`. Braces are balanced, so counting them is enough. */
function block(source: string, pattern: RegExp) {
    const head = pattern.exec(source);
    if (!head) return null;
    const start = source.indexOf('{', head.index);
    if (start === -1) return null;

    let depth = 0;
    for (let i = start; i < source.length; i++) {
        if (source[i] === '{') depth++;
        else if (source[i] === '}' && --depth === 0) return { body: source.slice(start + 1, i), head: head[0] };
    }
    return null;
}

/** A component's API, once its `types.ts` has arrived; asking starts the fetch. */
export function apiOf(component: string): ApiDoc | null {
    const source = loaded.get(component);
    if (source === undefined) {
        loadApi(component).catch(() => {});
        return null;
    }

    // A component made only of parts (`Form.Root`, `Form.Field`…) is documented by its root part.
    const find = (kind: 'interface' | 'type', suffix: string) =>
        block(source, new RegExp(`export ${kind} ${component}${suffix}\\b[^{]*`)) ?? block(source, new RegExp(`export ${kind} ${component}Root${suffix}\\b[^{]*`));
    const props = find('interface', 'Props');
    const emits = find('type', 'Emits');
    const slots = find('interface', 'Slots');

    return {
        props: props ? members(props.body) : [],
        emits: emits ? members(emits.body).map((m) => ({ ...m, type: m.type.replace(/^\[|\]$/g, '') || '—' })) : [],
        slots: slots ? members(slots.body).map((m) => ({ ...m, type: m.type.replace(/\s*=>\s*unknown$/, '').replace(/^\(\)$/, '—') })) : [],
        extends: props?.head.match(/extends ([\w, ]+)/)?.[1]?.split(',').map((s) => s.trim()) ?? []
    };
}

/**
 * A member's doc comment in the page's language. The comment in `types.ts` is
 * the English; a translation is `locales/<lang>/api/<component>.json`, by kind
 * and name: `{ "props": { "severity": "…" }, "emits": {}, "slots": {} }`.
 */
export function memberDoc(component: string, kind: 'props' | 'emits' | 'slots', member: ApiMember): string | undefined {
    return lookup(`api/${component.toLowerCase()}`, `${kind}.${member.name}`) ?? member.doc;
}

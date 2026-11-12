// A component's API, read out of its `types.ts` as text. The site's tables are
// made of this, and so is the history of what each release added or changed
// (`./changes.ts`), which reads the same file as it was at every tag. Nothing
// here knows about Vue or the site, so both can use it.

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

/** A component's API, from its `types.ts` and the base types its props may extend. */
export function parseApi(source: string, component: string, sharedTypes: string): ApiDoc {
    // A component made only of parts (`Form.Root`, `Form.Field`…) is documented by its root part.
    const find = (kind: 'interface' | 'type', suffix: string) =>
        block(source, new RegExp(`export ${kind} ${component}${suffix}\\b[^{]*`)) ?? block(source, new RegExp(`export ${kind} ${component}Root${suffix}\\b[^{]*`));
    const props = find('interface', 'Props');
    const emits = find('type', 'Emits');
    const slots = find('interface', 'Slots');
    const parents = props?.head.match(/extends ([\w, ]+)/)?.[1]?.split(',').map((s) => s.trim()) ?? [];

    // Props shared by a family of components (`MaskFieldProps`) are declared
    // once in the base types and listed on each page after the component's
    // own; one the component declares again, to narrow it, keeps its own row.
    const own = props ? members(props.body) : [];
    const inherited = parents
        .filter((name) => name !== 'BaseProps')
        .flatMap((name) => {
            const shared = block(sharedTypes, new RegExp(`export interface ${name}\\b[^{]*`));
            return shared ? members(shared.body) : [];
        })
        .filter((member) => !own.some((m) => m.name === member.name));

    return {
        props: [...own, ...inherited],
        emits: emits ? members(emits.body).map((m) => ({ ...m, type: m.type.replace(/^\[|\]$/g, '') || '—' })) : [],
        slots: slots ? members(slots.body).map((m) => ({ ...m, type: m.type.replace(/\s*=>\s*unknown$/, '').replace(/^\(\)$/, '—') })) : [],
        extends: parents
    };
}

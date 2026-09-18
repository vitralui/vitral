import { classOf, cn, type ClassEntry, type ClassValue, type ComponentStyle } from '@vitral/core';
import type { Props } from './h';

/** Whatever one part's pass-through is handed: the part, its state, and the chart's inputs. */
export interface ChartPassThroughContext {
    part: string;
    state: unknown;
    props: Record<string, unknown>;
}

/**
 * Pass-through for one part: attributes (`class`, `style`, `aria-*`, `data-*`,
 * `on<Event>` listeners), a function of the part's context returning them, or a
 * bare string taken as a class.
 */
export type ChartPassThroughValue = Props | string | ((context: ChartPassThroughContext) => Props | string | undefined);

/** Pass-through by part name (`root`, `canvas`, `legendItem`, `tooltip`… — the keys of `chartStyle.classes`). */
export type ChartPassThrough = Record<string, ChartPassThroughValue | undefined>;

type StyleLike = string | Record<string, unknown> | null | undefined;

function styleRecord(value: StyleLike): Record<string, unknown> {
    if (!value) return {};
    if (typeof value !== 'string') return value;
    const out: Record<string, unknown> = {};
    for (const decl of value.split(';')) {
        const at = decl.indexOf(':');
        if (at > 0) out[decl.slice(0, at).trim()] = decl.slice(at + 1).trim();
    }
    return out;
}

/**
 * Merges attribute sets the way a template merges bound attributes: classes
 * add up, styles merge (later wins per property), listeners both run, and any
 * other attribute takes the later value.
 */
export function mergeAttrs(...sets: (Props | undefined | null)[]): Props {
    const out: Props = {};
    for (const set of sets) {
        if (!set) continue;
        for (const [key, value] of Object.entries(set)) {
            if (key === 'class') {
                const joined = cn(out.class as ClassValue, value as ClassValue);
                out.class = joined || undefined;
            } else if (key === 'style') {
                const a = styleRecord(out.style as StyleLike);
                const b = styleRecord(value as StyleLike);
                const merged = { ...a };
                // A kebab-case property replaces its camelCase spelling, and back.
                for (const [k, v] of Object.entries(b)) {
                    const camel = k.startsWith('--') ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
                    const kebab = k.startsWith('--') ? k : k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
                    delete merged[camel];
                    delete merged[kebab];
                    merged[k] = v;
                }
                out.style = merged;
            } else if (key.startsWith('on') && typeof value === 'function' && typeof out[key] === 'function' && out[key] !== value) {
                const first = out[key] as (e: Event) => void;
                const second = value as (e: Event) => void;
                out[key] = (e: Event) => {
                    first(e);
                    second(e);
                };
            } else out[key] = value;
        }
    }
    return out;
}

function resolve(value: ChartPassThroughValue | undefined, context: ChartPassThroughContext): Props {
    const resolved = typeof value === 'function' ? value(context) : value;
    if (resolved === undefined) return {};
    return typeof resolved === 'string' ? { class: resolved } : resolved;
}

export interface PartOptions {
    style: ComponentStyle;
    unstyled: () => boolean;
    classes: () => Partial<Record<string, ClassEntry>> | undefined;
    pt: () => ChartPassThrough | undefined;
    props: () => Record<string, unknown>;
}

/**
 * The attributes of one part in one state: its classes (unless unstyled, and
 * with any per-part replacement from `classes`), then its pass-through.
 */
export function partResolver(options: PartOptions) {
    return function part(name: string, state?: unknown): Props {
        let cls: string | undefined;
        if (!options.unstyled()) {
            const own = options.classes()?.[name];
            cls = (own !== undefined ? classOf({ name: '', css: '', classes: { [name]: own } }, name, state) : classOf(options.style, name, state)) || undefined;
        }
        const pt = options.pt()?.[name];
        if (!pt) return { class: cls };
        return mergeAttrs({ class: cls }, resolve(pt, { part: name, state, props: options.props() }));
    };
}

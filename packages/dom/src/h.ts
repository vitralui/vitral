// A small keyed DOM patcher: a component describes its markup as a tree of
// plain objects on every change, and only what differs reaches the document.
// Keeping elements (rather than rebuilding them) matters: a mark that is
// replaced replays its entry animation, a button that is replaced loses focus,
// and a cell that is replaced loses the caret in it.
//
// It is deliberately tiny (elements, text, raw nodes handed in by a hook, keys,
// attributes, inline styles, listeners and a `ref` callback) and it has no
// framework in it.

const SVG_NS = 'http://www.w3.org/2000/svg';

export type Listener = (event: never) => void;

export type StyleValue = string | Record<string, string | number | null | undefined> | null | undefined;

/** Attributes, `class`, `style`, `on<Event>` listeners, `innerHTML` and `ref`. */
export type Props = Record<string, unknown>;

export interface VElement {
    kind: 'element';
    tag: string;
    svg: boolean;
    key?: string | number;
    props: Props;
    children: VNode[];
    el?: Element;
}

export interface VText {
    kind: 'text';
    text: string;
    el?: Text;
}

/** A node made elsewhere (a framework's slot, a hook's result), placed as it is. */
export interface VRaw {
    kind: 'raw';
    node: Node;
    el?: Node;
}

export type VNode = VElement | VText | VRaw;

/** What a view function may return as a child: nothing, text, a node, or a list of them. */
export type Child = VNode | string | number | Node | null | undefined | false | Child[];

function normalize(children: Child[], out: VNode[] = []): VNode[] {
    for (const c of children) {
        if (c === null || c === undefined || c === false) continue;
        if (Array.isArray(c)) normalize(c, out);
        else if (typeof c === 'string' || typeof c === 'number') out.push({ kind: 'text', text: String(c) });
        else if (typeof Node !== 'undefined' && c instanceof Node) {
            if (c.nodeType === 11) for (const n of Array.from(c.childNodes)) out.push({ kind: 'raw', node: n });
            else out.push({ kind: 'raw', node: c });
        } else out.push(c as VNode);
    }
    return out;
}

/** An HTML element. */
export function h(tag: string, props: Props | null = null, ...children: Child[]): VElement {
    const p = props ?? {};
    return { kind: 'element', tag, svg: false, key: p.key as string | number | undefined, props: p, children: normalize(children) };
}

/** An SVG element. */
export function s(tag: string, props: Props | null = null, ...children: Child[]): VElement {
    const p = props ?? {};
    return { kind: 'element', tag, svg: true, key: p.key as string | number | undefined, props: p, children: normalize(children) };
}

const kebab = (name: string) => (name.startsWith('--') ? name : name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));

function styleObject(value: StyleValue): Record<string, string> {
    if (!value) return {};
    if (typeof value === 'string') {
        const out: Record<string, string> = {};
        for (const decl of value.split(';')) {
            const at = decl.indexOf(':');
            if (at > 0) out[decl.slice(0, at).trim()] = decl.slice(at + 1).trim();
        }
        return out;
    }
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(value)) if (v !== undefined && v !== null && v !== '') out[kebab(k)] = String(v);
    return out;
}

interface Invokers {
    [event: string]: { handler: Listener; invoke: (event: Event) => void };
}

const invokersOf = new WeakMap<Element, Invokers>();

function setListener(el: Element, name: string, handler: Listener | undefined) {
    const event = name.slice(2).toLowerCase();
    let all = invokersOf.get(el);
    if (!all) invokersOf.set(el, (all = {}));
    const current = all[event];
    if (handler) {
        if (current) current.handler = handler;
        else {
            const entry = { handler, invoke: (e: Event) => (entry.handler as (e: Event) => void)(e) };
            all[event] = entry;
            el.addEventListener(event, entry.invoke);
        }
    } else if (current) {
        el.removeEventListener(event, current.invoke);
        delete all[event];
    }
}

/** `value` on a field is what it holds; on anything else it is an attribute. */
const isFormValue = (el: Element, key: string) => key === 'value' && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');

const isListener = (key: string, value: unknown) => key.length > 2 && key.startsWith('on') && key[2] === key[2]!.toUpperCase() && (typeof value === 'function' || value === undefined);

/** Brings an element's attributes, style and listeners from `prev` to `next`. */
export function patchProps(el: Element, prev: Props, next: Props): void {
    for (const key of Object.keys(prev)) {
        if (key in next || key === 'key' || key === 'ref') continue;
        if (key === 'style') (el as HTMLElement).removeAttribute('style');
        else if (key === 'innerHTML') el.innerHTML = '';
        else if (isListener(key, prev[key])) setListener(el, key, undefined);
        else el.removeAttribute(key);
    }
    for (const [key, value] of Object.entries(next)) {
        if (key === 'key') continue;
        if (key === 'ref') continue;
        const old = prev[key];
        if (key === 'style') {
            const a = styleObject(old as StyleValue);
            const b = styleObject(value as StyleValue);
            const style = (el as HTMLElement).style;
            for (const name of Object.keys(a)) if (!(name in b)) style.removeProperty(name);
            for (const [name, v] of Object.entries(b)) if (a[name] !== v || style.getPropertyValue(name) === '') style.setProperty(name, v);
            if (!Object.keys(b).length && el.getAttribute('style') === '') el.removeAttribute('style');
            continue;
        }
        if (key === 'innerHTML') {
            // Compared with the last value, not the element's serialisation (which the browser rewrites).
            if (value !== old) el.innerHTML = String(value ?? '');
            continue;
        }
        if (isListener(key, value) || (typeof value === 'function' && key.startsWith('on'))) {
            setListener(el, key, value as Listener | undefined);
            continue;
        }
        // What a control holds is a property, not an attribute: once a person
        // has typed into a field the attribute no longer reaches it, so a
        // component that draws its own value has to put it there. Compared
        // with what the control holds rather than with what was drawn last,
        // so a value that was typed over is put back.
        if (isFormValue(el, key)) {
            const text = value === undefined || value === null || value === false ? '' : String(value);
            if ((el as HTMLInputElement).value !== text) (el as HTMLInputElement).value = text;
            continue;
        }
        if (key === 'checked' && (el as HTMLInputElement).type !== undefined && el.tagName === 'INPUT') {
            (el as HTMLInputElement).checked = !!value && value !== 'false';
            continue;
        }
        if (value === old) continue;
        if (value === undefined || value === null || value === false) el.removeAttribute(key);
        else el.setAttribute(key, value === true ? '' : String(value));
    }
    (next.ref as ((el: Element) => void) | undefined)?.(el);
}

function create(node: VNode): Node {
    if (node.kind === 'text') return (node.el = document.createTextNode(node.text));
    if (node.kind === 'raw') return (node.el = node.node);
    const el = node.svg ? document.createElementNS(SVG_NS, node.tag) : document.createElement(node.tag);
    node.el = el;
    // Children first, so an `innerHTML` prop is not wiped and a `ref` sees a whole element.
    for (const child of node.children) el.appendChild(create(child));
    patchProps(el, {}, node.props);
    return el;
}

function same(a: VNode, b: VNode): boolean {
    if (a.kind !== b.kind) return false;
    if (a.kind === 'element') return a.tag === (b as VElement).tag && a.key === (b as VElement).key && a.svg === (b as VElement).svg;
    if (a.kind === 'raw') return a.node === (b as VRaw).node;
    return true;
}

function patchNode(prev: VNode, next: VNode): void {
    next.el = prev.el as never;
    if (next.kind === 'text') {
        if ((prev as VText).text !== next.text) (next.el as Text).data = next.text;
        return;
    }
    if (next.kind === 'raw') return;
    const el = next.el as Element;
    const p = prev as VElement;
    if (!('innerHTML' in next.props)) patchChildren(el, p.children, next.children);
    patchProps(el, p.props, next.props);
}

/** Brings `parent`'s children from `prev` to `next`, reusing elements by key, or by position and tag. */
export function patchChildren(parent: Node, prev: VNode[], next: VNode[]): void {
    const keyed = new Map<unknown, VNode>();
    const loose: VNode[] = [];
    for (const c of prev) {
        if (c.kind === 'element' && c.key !== undefined) keyed.set(`${c.tag}|${c.key}`, c);
        else loose.push(c);
    }
    const used = new Set<VNode>();
    let cursor = 0;
    for (const c of next) {
        let match: VNode | undefined;
        if (c.kind === 'element' && c.key !== undefined) {
            match = keyed.get(`${c.tag}|${c.key}`);
        } else {
            for (let i = cursor; i < loose.length; i++) {
                const candidate = loose[i]!;
                if (!used.has(candidate) && same(candidate, c)) {
                    match = candidate;
                    cursor = i + 1;
                    break;
                }
            }
        }
        if (match && !used.has(match) && same(match, c)) {
            used.add(match);
            patchNode(match, c);
        } else create(c);
    }
    for (const c of prev) if (!used.has(c) && c.el && c.el.parentNode === parent) parent.removeChild(c.el);
    // Place in order, moving only what is out of place (a moved element loses focus).
    let anchor: Node | null = null;
    for (let i = next.length - 1; i >= 0; i--) {
        const el = next[i]!.el!;
        if (el.parentNode !== parent || el.nextSibling !== anchor) parent.insertBefore(el, anchor);
        anchor = el;
    }
}

/**
 * One element kept in a container the component does not own (a popup in the
 * overlay host): it is patched in place and never touches its siblings.
 */
export function createPortal() {
    let current: VNode | null = null;
    return {
        render(container: Node | null, next: VElement | null): Element | null {
            if (!next || !container) {
                if (current?.el?.parentNode) current.el.parentNode.removeChild(current.el);
                current = null;
                return null;
            }
            if (current && same(current, next)) patchNode(current, next);
            else {
                if (current?.el?.parentNode) current.el.parentNode.removeChild(current.el);
                create(next);
            }
            if (next.el!.parentNode !== container) container.appendChild(next.el!);
            current = next;
            return next.el as Element;
        },
        element: () => (current?.el as Element | undefined) ?? null
    };
}

/** A mounted tree: `render(children)` patches the container's content to match. */
export function createRoot(container: Element) {
    let current: VNode[] = [];
    let props: Props = {};
    return {
        /** Patches the container's own attributes (it is the component's root). */
        attrs(next: Props) {
            patchProps(container, props, next);
            props = next;
        },
        render(...children: Child[]) {
            const next = normalize(children);
            patchChildren(container, current, next);
            current = next;
        },
        /** Removes what this root added: its children, attributes and listeners. */
        clear() {
            patchChildren(container, current, []);
            current = [];
            patchProps(container, props, {});
            for (const key of Object.keys(props)) if (key !== 'key' && key !== 'ref' && !key.startsWith('on')) container.removeAttribute(key);
            props = {};
        }
    };
}

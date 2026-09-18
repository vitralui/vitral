// The rich-text document: a tree of plain objects in the ProseMirror/TipTap
// JSON shape (`{ type, attrs, content, text, marks }`), treated as immutable.
// Every edit builds a new tree that shares the untouched branches, so an undo
// entry is just the old root and "did this block change?" is `a === b`.
//
// A position names a text block by its path of child indices from the root
// and a character offset inside it (UTF-16 units, a hard break counting one),
// which is exactly how the DOM counts, so mapping a DOM selection is direct.

export type EditorNodeType =
    | 'doc'
    | 'paragraph'
    | 'heading'
    | 'codeBlock'
    | 'blockquote'
    | 'bulletList'
    | 'orderedList'
    | 'taskList'
    | 'listItem'
    | 'taskItem'
    | 'horizontalRule'
    | 'image'
    | 'table'
    | 'tableRow'
    | 'tableCell'
    | 'tableHeader'
    | 'text'
    | 'hardBreak';

export type EditorMarkType = 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'link' | 'color' | 'highlight';

export interface EditorMarkAttrs {
    /** `link` */
    href?: string;
    /** `link`: `'_blank'` or nothing. */
    target?: string | null;
    /** `color` and `highlight`: a palette name (`'red'`). */
    color?: string;
}

export interface EditorMark {
    type: EditorMarkType;
    attrs?: EditorMarkAttrs;
}

export interface EditorNodeAttrs {
    /** `heading`: 1–3. */
    level?: number;
    /** `codeBlock` */
    language?: string | null;
    /** `orderedList` */
    start?: number;
    /** `taskItem` */
    checked?: boolean;
    /** `image` */
    src?: string;
    alt?: string;
    title?: string | null;
}

export interface EditorNode {
    type: EditorNodeType;
    attrs?: EditorNodeAttrs;
    content?: EditorNode[];
    /** `text` only. */
    text?: string;
    /** `text` only. */
    marks?: EditorMark[];
}

export type EditorPath = number[];

export interface EditorPosition {
    /** Child indices from the document to a text block. */
    path: EditorPath;
    /** Offset inside the block's text; a hard break counts one. */
    offset: number;
}

// ---- node kinds ---------------------------------------------------------------

export const TEXTBLOCKS: ReadonlySet<string> = new Set(['paragraph', 'heading', 'codeBlock']);
export const ATOMS: ReadonlySet<string> = new Set(['horizontalRule', 'image']);
export const LISTS: ReadonlySet<string> = new Set(['bulletList', 'orderedList', 'taskList']);
export const ITEMS: ReadonlySet<string> = new Set(['listItem', 'taskItem']);
export const CELLS: ReadonlySet<string> = new Set(['tableCell', 'tableHeader']);
/** Nodes whose children are blocks. */
export const BLOCK_CONTAINERS: ReadonlySet<string> = new Set(['doc', 'blockquote', 'listItem', 'taskItem', 'tableCell', 'tableHeader']);

export const isTextblock = (node: EditorNode | undefined | null): boolean => !!node && TEXTBLOCKS.has(node.type);
export const isAtom = (node: EditorNode | undefined | null): boolean => !!node && ATOMS.has(node.type);
export const isList = (node: EditorNode | undefined | null): boolean => !!node && LISTS.has(node.type);
export const isItem = (node: EditorNode | undefined | null): boolean => !!node && ITEMS.has(node.type);
export const isCell = (node: EditorNode | undefined | null): boolean => !!node && CELLS.has(node.type);
export const itemTypeOf = (listType: string): EditorNodeType => (listType === 'taskList' ? 'taskItem' : 'listItem');

/** The order marks nest in, outermost first, in HTML and Markdown alike. */
export const MARK_ORDER: readonly EditorMarkType[] = ['link', 'color', 'highlight', 'bold', 'italic', 'underline', 'strike', 'code'];
/** Marks that do not grow when typing at their end. */
const NON_INCLUSIVE: ReadonlySet<string> = new Set(['link']);

// ---- builders -----------------------------------------------------------------

type InlineInput = string | EditorNode;
const inline = (parts: InlineInput[]): EditorNode[] => normalizeInline(parts.map((p) => (typeof p === 'string' ? { type: 'text' as const, text: p } : p)));

/**
 * Terse constructors for documents, for the specs and for an application
 * seeding content by hand. `ed.p('Hello ', ed.t('world', ed.bold()))`.
 */
export const editorNodes = {
    doc: (...content: EditorNode[]): EditorNode => ({ type: 'doc', content }),
    p: (...content: InlineInput[]): EditorNode => ({ type: 'paragraph', content: inline(content) }),
    h: (level: number, ...content: InlineInput[]): EditorNode => ({ type: 'heading', attrs: { level }, content: inline(content) }),
    code: (text = '', language: string | null = null): EditorNode => ({ type: 'codeBlock', attrs: { language }, content: text ? [{ type: 'text', text }] : [] }),
    quote: (...content: EditorNode[]): EditorNode => ({ type: 'blockquote', content }),
    ul: (...content: EditorNode[]): EditorNode => ({ type: 'bulletList', content }),
    ol: (...content: EditorNode[]): EditorNode => ({ type: 'orderedList', attrs: { start: 1 }, content }),
    tasks: (...content: EditorNode[]): EditorNode => ({ type: 'taskList', content }),
    li: (...content: (EditorNode | string)[]): EditorNode => ({ type: 'listItem', content: content.map((c) => (typeof c === 'string' ? editorNodes.p(c) : c)) }),
    task: (checked: boolean, ...content: (EditorNode | string)[]): EditorNode => ({
        type: 'taskItem',
        attrs: { checked },
        content: content.map((c) => (typeof c === 'string' ? editorNodes.p(c) : c))
    }),
    hr: (): EditorNode => ({ type: 'horizontalRule' }),
    img: (src: string, alt = '', title: string | null = null): EditorNode => ({ type: 'image', attrs: { src, alt, title } }),
    table: (...rows: EditorNode[]): EditorNode => ({ type: 'table', content: rows }),
    tr: (...cells: EditorNode[]): EditorNode => ({ type: 'tableRow', content: cells }),
    td: (...content: (EditorNode | string)[]): EditorNode => ({ type: 'tableCell', content: content.map((c) => (typeof c === 'string' ? editorNodes.p(c) : c)) }),
    th: (...content: (EditorNode | string)[]): EditorNode => ({ type: 'tableHeader', content: content.map((c) => (typeof c === 'string' ? editorNodes.p(c) : c)) }),
    t: (text: string, ...marks: EditorMark[]): EditorNode => (marks.length ? { type: 'text', text, marks: sortMarks(marks) } : { type: 'text', text }),
    br: (): EditorNode => ({ type: 'hardBreak' }),
    bold: (): EditorMark => ({ type: 'bold' }),
    italic: (): EditorMark => ({ type: 'italic' }),
    underline: (): EditorMark => ({ type: 'underline' }),
    strike: (): EditorMark => ({ type: 'strike' }),
    inlineCode: (): EditorMark => ({ type: 'code' }),
    link: (href: string, target: string | null = null): EditorMark => ({ type: 'link', attrs: { href, target } }),
    color: (color: string): EditorMark => ({ type: 'color', attrs: { color } }),
    highlight: (color: string): EditorMark => ({ type: 'highlight', attrs: { color } })
};

export function emptyParagraph(): EditorNode {
    return { type: 'paragraph', content: [] };
}

/** A text block of `type` holding `content`, normalised; a code block keeps only plain text. */
export function makeTextblock(type: EditorNodeType, attrs: EditorNodeAttrs | undefined, content: EditorNode[]): EditorNode {
    if (type === 'codeBlock') {
        const text = inlineText(content);
        return { type, attrs: { language: attrs?.language ?? null }, content: text ? [{ type: 'text', text }] : [] };
    }
    // Newlines (from a code block turned into a paragraph) become hard breaks.
    const body = content.flatMap((n) => (n.type === 'text' && n.text?.includes('\n') ? textToInline(n.text, n.marks) : [n]));
    const node: EditorNode = { type, content: normalizeInline(body) };
    if (type === 'heading') node.attrs = { level: clampLevel(attrs?.level) };
    return node;
}

/** The same text block with new inline content. */
export function withContent(block: EditorNode, content: EditorNode[]): EditorNode {
    return makeTextblock(block.type, block.attrs, content);
}

export const clampLevel = (level: unknown): number => Math.min(3, Math.max(1, Math.round(Number(level) || 1)));

// ---- marks --------------------------------------------------------------------

export function sameMark(a: EditorMark, b: EditorMark): boolean {
    if (a.type !== b.type) return false;
    const x = a.attrs ?? {};
    const y = b.attrs ?? {};
    return (x.href ?? null) === (y.href ?? null) && (x.target ?? null) === (y.target ?? null) && (x.color ?? null) === (y.color ?? null);
}

export function sortMarks(marks: readonly EditorMark[]): EditorMark[] {
    return [...marks].sort((a, b) => MARK_ORDER.indexOf(a.type) - MARK_ORDER.indexOf(b.type));
}

export function sameMarkSet(a: readonly EditorMark[] | undefined, b: readonly EditorMark[] | undefined): boolean {
    const x = a ?? [];
    const y = b ?? [];
    return x.length === y.length && x.every((m) => y.some((n) => sameMark(m, n)));
}

/** A set with `mark` in it, replacing any mark of the same type (a link, a colour). */
export function addToSet(marks: readonly EditorMark[] | undefined, mark: EditorMark): EditorMark[] {
    return sortMarks([...(marks ?? []).filter((m) => m.type !== mark.type), mark]);
}

export function removeFromSet(marks: readonly EditorMark[] | undefined, type: EditorMarkType): EditorMark[] {
    return (marks ?? []).filter((m) => m.type !== type);
}

export const hasMark = (marks: readonly EditorMark[] | undefined, type: EditorMarkType): boolean => !!marks?.some((m) => m.type === type);
export const findMark = (marks: readonly EditorMark[] | undefined, type: EditorMarkType): EditorMark | undefined => marks?.find((m) => m.type === type);

// ---- inline content -------------------------------------------------------------

const nodeLength = (node: EditorNode): number => (node.type === 'text' ? (node.text ?? '').length : 1);

export function inlineLength(content: readonly EditorNode[] | undefined): number {
    let n = 0;
    for (const node of content ?? []) n += nodeLength(node);
    return n;
}

/** The block's text, a hard break read as a newline, so offsets line up with positions. */
export function inlineText(content: readonly EditorNode[] | undefined): string {
    let s = '';
    for (const node of content ?? []) s += node.type === 'text' ? (node.text ?? '') : '\n';
    return s;
}

/** Text with its newlines turned into hard breaks, every piece carrying `marks`. */
export function textToInline(text: string, marks?: EditorMark[]): EditorNode[] {
    const out: EditorNode[] = [];
    text.split(/\r\n?|\n/).forEach((line, i) => {
        if (i > 0) out.push({ type: 'hardBreak' });
        if (line) out.push(marks?.length ? { type: 'text', text: line, marks } : { type: 'text', text: line });
    });
    return out;
}

export function sliceInline(content: readonly EditorNode[] | undefined, from: number, to = Infinity): EditorNode[] {
    const out: EditorNode[] = [];
    let pos = 0;
    for (const node of content ?? []) {
        const start = pos;
        const end = pos + nodeLength(node);
        pos = end;
        if (end <= from || start >= to) continue;
        if (node.type === 'text') out.push({ ...node, text: node.text!.slice(Math.max(from, start) - start, Math.min(to, end) - start) });
        else out.push(node);
    }
    return out;
}

/** Drops empty text, merges neighbours with the same marks, orders the marks. */
export function normalizeInline(content: readonly EditorNode[] | undefined): EditorNode[] {
    const out: EditorNode[] = [];
    for (const node of content ?? []) {
        if (node.type === 'text') {
            if (!node.text) continue;
            const marks = node.marks?.length ? sortMarks(node.marks) : undefined;
            const last = out[out.length - 1];
            if (last?.type === 'text' && sameMarkSet(last.marks, marks)) {
                out[out.length - 1] = { ...last, text: last.text! + node.text };
                continue;
            }
            out.push(marks ? { type: 'text', text: node.text, marks } : { type: 'text', text: node.text });
        } else if (node.type === 'hardBreak') {
            out.push({ type: 'hardBreak' });
        }
    }
    return out;
}

export function replaceInline(content: readonly EditorNode[] | undefined, from: number, to: number, insert: readonly EditorNode[]): EditorNode[] {
    return normalizeInline([...sliceInline(content, 0, from), ...insert, ...sliceInline(content, to)]);
}

function mapInline(content: readonly EditorNode[] | undefined, from: number, to: number, fn: (node: EditorNode) => EditorNode): EditorNode[] {
    return normalizeInline([...sliceInline(content, 0, from), ...sliceInline(content, from, to).map(fn), ...sliceInline(content, to)]);
}

export function addMarkInline(content: readonly EditorNode[] | undefined, from: number, to: number, mark: EditorMark): EditorNode[] {
    return mapInline(content, from, to, (n) => (n.type === 'text' ? { ...n, marks: addToSet(n.marks, mark) } : n));
}

export function removeMarkInline(content: readonly EditorNode[] | undefined, from: number, to: number, type: EditorMarkType | null): EditorNode[] {
    return mapInline(content, from, to, (n) => (n.type === 'text' ? { ...n, marks: type ? removeFromSet(n.marks, type) : [] } : n));
}

/** Whether every character in the range carries a mark of `type` (and, given `attrs`, those attrs). */
export function rangeHasMark(content: readonly EditorNode[] | undefined, from: number, to: number, type: EditorMarkType, attrs?: EditorMarkAttrs): boolean {
    const texts = sliceInline(content, from, to).filter((n) => n.type === 'text');
    if (!texts.length) return false;
    return texts.every((n) => n.marks?.some((m) => m.type === type && (!attrs || sameMark(m, { type, attrs }))));
}

/**
 * The marks typing at `offset` would carry: those of the character before
 * it (after it, at the very start). A link ends where it ends, so typing right
 * after one does not lengthen it.
 */
export function marksAt(content: readonly EditorNode[] | undefined, offset: number): EditorMark[] {
    const before = offset > 0 ? sliceInline(content, offset - 1, offset)[0] : undefined;
    const after = sliceInline(content, offset, offset + 1)[0];
    const afterMarks = after?.type === 'text' ? (after.marks ?? []) : [];
    if (before?.type === 'text') return (before.marks ?? []).filter((m) => !NON_INCLUSIVE.has(m.type) || afterMarks.some((n) => sameMark(n, m)));
    return afterMarks.filter((m) => !NON_INCLUSIVE.has(m.type));
}

/** The marks on the character right after `offset`. */
export function marksAfter(content: readonly EditorNode[] | undefined, offset: number): EditorMark[] {
    const node = sliceInline(content, offset, offset + 1)[0];
    return node?.type === 'text' ? (node.marks ?? []) : [];
}

/** The stretch around `offset` covered by one unbroken mark of `type`. */
export function markExtent(content: readonly EditorNode[] | undefined, offset: number, type: EditorMarkType): { from: number; to: number; mark: EditorMark } | null {
    const spans: { from: number; to: number; mark?: EditorMark }[] = [];
    let pos = 0;
    for (const node of content ?? []) {
        const len = nodeLength(node);
        spans.push({ from: pos, to: pos + len, mark: node.type === 'text' ? findMark(node.marks, type) : undefined });
        pos += len;
    }
    // The span the offset is inside, else the one ending at it, else the one starting at it.
    let index = spans.findIndex((s) => s.mark && s.from < offset && offset < s.to);
    if (index < 0) index = spans.findIndex((s) => s.mark && s.to === offset);
    if (index < 0) index = spans.findIndex((s) => s.mark && s.from === offset);
    if (index < 0) return null;
    const mark = spans[index]!.mark!;
    let first = index;
    let last = index;
    while (first > 0 && spans[first - 1]!.mark && sameMark(spans[first - 1]!.mark!, mark)) first--;
    while (last < spans.length - 1 && spans[last + 1]!.mark && sameMark(spans[last + 1]!.mark!, mark)) last++;
    return { from: spans[first]!.from, to: spans[last]!.to, mark };
}

// ---- tree -----------------------------------------------------------------------

export function nodeAt(root: EditorNode, path: readonly number[]): EditorNode | undefined {
    let node: EditorNode | undefined = root;
    for (const i of path) {
        node = node?.content?.[i];
        if (!node) return undefined;
    }
    return node;
}

/** A new tree where the node at `path` is replaced by `nodes` (none removes it). */
export function replaceAt(root: EditorNode, path: readonly number[], nodes: readonly EditorNode[]): EditorNode {
    if (!path.length) throw new Error('replaceAt: the root cannot be replaced');
    const [index, ...rest] = path as [number, ...number[]];
    const content = (root.content ?? []).slice();
    if (rest.length) content[index] = replaceAt(content[index]!, rest, nodes);
    else content.splice(index, 1, ...nodes);
    return { ...root, content };
}

/** A new tree with `nodes` inserted into the node at `parent`, before child `index`. */
export function insertAt(root: EditorNode, parent: readonly number[], index: number, nodes: readonly EditorNode[]): EditorNode {
    if (!parent.length) {
        const content = (root.content ?? []).slice();
        content.splice(index, 0, ...nodes);
        return { ...root, content };
    }
    const target = nodeAt(root, parent)!;
    const content = (target.content ?? []).slice();
    content.splice(index, 0, ...nodes);
    return replaceAt(root, parent, [{ ...target, content }]);
}

export interface EditorLeaf {
    path: EditorPath;
    node: EditorNode;
    kind: 'text' | 'atom';
}

/** Text blocks and atoms, in document order. */
export function leaves(root: EditorNode): EditorLeaf[] {
    const out: EditorLeaf[] = [];
    const walk = (node: EditorNode, path: number[]) => {
        (node.content ?? []).forEach((child, i) => {
            const p = [...path, i];
            if (isTextblock(child)) out.push({ path: p, node: child, kind: 'text' });
            else if (isAtom(child)) out.push({ path: p, node: child, kind: 'atom' });
            else if (child.content) walk(child, p);
        });
    };
    walk(root, []);
    return out;
}

export function textblocks(root: EditorNode): EditorLeaf[] {
    return leaves(root).filter((leaf) => leaf.kind === 'text');
}

/** Document order: a path before another, or an ancestor before its descendants. */
export function comparePaths(a: readonly number[], b: readonly number[]): number {
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) if (a[i] !== b[i]) return a[i]! - b[i]!;
    return a.length - b.length;
}

export const samePath = (a: readonly number[], b: readonly number[]): boolean => a.length === b.length && comparePaths(a, b) === 0;
export const isPrefix = (prefix: readonly number[], path: readonly number[]): boolean => prefix.length <= path.length && prefix.every((v, i) => path[i] === v);

export function comparePositions(a: EditorPosition, b: EditorPosition): number {
    return comparePaths(a.path, b.path) || a.offset - b.offset;
}

/** The path of `target` (by identity) in the tree, or null. */
export function pathOf(root: EditorNode, target: EditorNode): EditorPath | null {
    const walk = (node: EditorNode, path: number[]): EditorPath | null => {
        const content = node.content ?? [];
        for (let i = 0; i < content.length; i++) {
            const child = content[i]!;
            if (child === target) return [...path, i];
            if (child.content && !isTextblock(child)) {
                const found = walk(child, [...path, i]);
                if (found) return found;
            }
        }
        return null;
    };
    return walk(root, []);
}

/** The ancestors of `path` from the root down (the root included, the node itself not), with their paths. */
export function ancestors(root: EditorNode, path: readonly number[]): { node: EditorNode; path: EditorPath }[] {
    const out: { node: EditorNode; path: EditorPath }[] = [{ node: root, path: [] }];
    let node = root;
    for (let i = 0; i < path.length - 1; i++) {
        node = node.content![path[i]!]!;
        out.push({ node, path: path.slice(0, i + 1) });
    }
    return out;
}

/** The deepest ancestor of `path` (or the node itself) matching `test`. */
export function closest(root: EditorNode, path: readonly number[], test: (node: EditorNode) => boolean): { node: EditorNode; path: EditorPath } | null {
    for (let depth = path.length; depth >= 0; depth--) {
        const p = path.slice(0, depth);
        const node = nodeAt(root, p);
        if (node && test(node)) return { node, path: p };
    }
    return null;
}

// ---- normalisation --------------------------------------------------------------

/**
 * Makes a tree well formed after an edit: no empty containers, list items that
 * start with a text block, adjacent lists of one kind joined, tables with a
 * block in every cell and a paragraph after a trailing atom or table. Text
 * blocks come through as the same objects, which is how a selection follows
 * its block through the reshaping.
 */
export function normalizeDoc(doc: EditorNode): EditorNode {
    const content = normalizeBlocks(doc.content ?? []);
    const last = content[content.length - 1];
    if (!last || isAtom(last) || last.type === 'table') content.push(emptyParagraph());
    return sameContent(doc.content, content) && doc.type === 'doc' ? doc : { type: 'doc', content };
}

function sameContent(a: readonly EditorNode[] | undefined, b: readonly EditorNode[]): boolean {
    return !!a && a.length === b.length && a.every((n, i) => n === b[i]);
}

const keep = (node: EditorNode, content: EditorNode[]): EditorNode => (sameContent(node.content, content) ? node : { ...node, content });

function normalizeBlocks(blocks: readonly EditorNode[]): EditorNode[] {
    const out: EditorNode[] = [];
    for (const block of blocks) {
        const node = normalizeBlock(block);
        if (!node) continue;
        const prev = out[out.length - 1];
        if (prev && isList(node) && prev.type === node.type) {
            out[out.length - 1] = { ...prev, content: [...prev.content!, ...node.content!] };
            continue;
        }
        out.push(node);
    }
    return out;
}

function normalizeBlock(block: EditorNode): EditorNode | null {
    if (isTextblock(block) || isAtom(block)) return block;
    switch (block.type) {
        case 'blockquote': {
            const content = normalizeBlocks(block.content ?? []);
            return content.length ? keep(block, content) : null;
        }
        case 'bulletList':
        case 'orderedList':
        case 'taskList': {
            const items = normalizeItems(block.content ?? [], itemTypeOf(block.type));
            return items.length ? keep(block, items) : null;
        }
        case 'table': {
            const rows = (block.content ?? []).map(normalizeRow).filter((r): r is EditorNode => !!r);
            if (!rows.length) return null;
            const width = Math.max(...rows.map((r) => r.content!.length));
            const padded = rows.map((r) => (r.content!.length < width ? { ...r, content: [...r.content!, ...Array.from({ length: width - r.content!.length }, () => cell('tableCell'))] } : r));
            return keep(block, padded);
        }
        case 'listItem':
        case 'taskItem':
            // An item outside a list: its blocks stand on their own.
            return null;
        default:
            return null;
    }
}

const cell = (type: EditorNodeType): EditorNode => ({ type, content: [emptyParagraph()] });

function normalizeRow(row: EditorNode): EditorNode | null {
    if (row.type !== 'tableRow') return null;
    const cells = (row.content ?? [])
        .filter(isCell)
        .map((c) => {
            const content = normalizeBlocks(c.content ?? []);
            return keep(c, content.length ? content : [emptyParagraph()]);
        });
    return cells.length ? keep(row, cells) : null;
}

export function convertItem(item: EditorNode, type: EditorNodeType): EditorNode {
    if (item.type === type) return item;
    return type === 'taskItem' ? { type, attrs: { checked: false }, content: item.content ?? [] } : { type, content: item.content ?? [] };
}

function normalizeItems(items: readonly EditorNode[], type: EditorNodeType): EditorNode[] {
    const out: EditorNode[] = [];
    for (const raw of items) {
        let item = isItem(raw) ? convertItem(raw, type) : { type, ...(type === 'taskItem' ? { attrs: { checked: false } } : {}), content: [raw] };
        let content = normalizeBlocks(item.content ?? []);
        if (!content.length) continue;
        if (!isTextblock(content[0])) {
            const prev = out[out.length - 1];
            if (prev) {
                // The item lost its text: what is left belongs to the item before it.
                out[out.length - 1] = { ...prev, content: normalizeBlocks([...prev.content!, ...content]) };
                continue;
            }
            if (content.every(isList)) {
                // The first item held only a sub-list: its items move up a level.
                for (const list of content) out.push(...normalizeItems(list.content ?? [], type));
                continue;
            }
            content = [emptyParagraph(), ...content];
        }
        item = keep(item, content);
        out.push(item);
    }
    return out;
}

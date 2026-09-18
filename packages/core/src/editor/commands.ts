import {
    addMarkInline,
    addToSet,
    BLOCK_CONTAINERS,
    closest,
    comparePaths,
    convertItem,
    emptyParagraph,
    hasMark,
    inlineLength,
    inlineText,
    isAtom,
    isCell,
    isItem,
    isList,
    isPrefix,
    isTextblock,
    itemTypeOf,
    leaves,
    makeTextblock,
    markExtent,
    marksAfter,
    marksAt,
    nodeAt,
    rangeHasMark,
    removeFromSet,
    removeMarkInline,
    replaceAt,
    replaceInline,
    samePath,
    sliceInline,
    textblocks,
    textToInline,
    withContent,
    type EditorMark,
    type EditorMarkAttrs,
    type EditorMarkType,
    type EditorNode,
    type EditorNodeAttrs,
    type EditorNodeType,
    type EditorPosition
} from './model';
import { sanitizeLanguage, sanitizeUrl } from './sanitize';
import {
    blocksInRange,
    caret,
    endOfDoc,
    finish,
    mapRef,
    selectionRange,
    selectionRefs,
    startOfDoc,
    type EditorSelection,
    type EditorState,
    type NodeRef
} from './state';

// Every edit is a pure function of the state: it returns the next state, or
// null when it does not apply — which is also how `can()` answers.

const last = <T>(list: readonly T[]): T => list[list.length - 1]!;

// ---- text units -------------------------------------------------------------------

type Segmenter = { segment(text: string): Iterable<{ index: number; segment: string }> };
let graphemes: Segmenter | null | undefined;
function segmenter(): Segmenter | null {
    if (graphemes === undefined) {
        const Ctor = (Intl as unknown as { Segmenter?: new (locale?: string, options?: { granularity: string }) => Segmenter }).Segmenter;
        graphemes = Ctor ? new Ctor(undefined, { granularity: 'grapheme' }) : null;
    }
    return graphemes;
}

const isLow = (code: number) => code >= 0xdc00 && code <= 0xdfff;

export function previousCharOffset(text: string, offset: number): number {
    if (offset <= 0) return 0;
    const seg = segmenter();
    if (seg) {
        let start = 0;
        for (const s of seg.segment(text.slice(0, offset))) start = s.index;
        return start;
    }
    return offset - (offset >= 2 && isLow(text.charCodeAt(offset - 1)) ? 2 : 1);
}

export function nextCharOffset(text: string, offset: number): number {
    if (offset >= text.length) return text.length;
    const seg = segmenter();
    if (seg) {
        for (const s of seg.segment(text.slice(offset))) return offset + s.segment.length;
    }
    return offset + (isLow(text.charCodeAt(offset + 1)) ? 2 : 1);
}

const isWordChar = (c: string | undefined) => !!c && /[\p{L}\p{N}_]/u.test(c);
const isSpace = (c: string | undefined) => !!c && /\s/.test(c);

export function previousWordOffset(text: string, offset: number): number {
    let i = offset;
    while (i > 0 && isSpace(text[i - 1])) i--;
    if (isWordChar(text[i - 1])) while (i > 0 && isWordChar(text[i - 1])) i--;
    else while (i > 0 && !isWordChar(text[i - 1]) && !isSpace(text[i - 1])) i--;
    return i;
}

export function nextWordOffset(text: string, offset: number): number {
    let i = offset;
    while (i < text.length && isSpace(text[i])) i++;
    if (isWordChar(text[i])) while (i < text.length && isWordChar(text[i])) i++;
    else while (i < text.length && !isWordChar(text[i]) && !isSpace(text[i])) i++;
    return i;
}

export type DeleteUnit = 'char' | 'word' | 'line';

// ---- structure helpers ---------------------------------------------------------------

function commonPrefix(a: readonly number[], b: readonly number[]): number[] {
    const out: number[] = [];
    for (let i = 0; i < Math.min(a.length, b.length) && a[i] === b[i]; i++) out.push(a[i]!);
    return out;
}

const cellOf = (doc: EditorNode, path: readonly number[]) => closest(doc, path.slice(0, -1), isCell)?.path ?? null;
const tableOf = (doc: EditorNode, path: readonly number[]) => closest(doc, path.slice(0, -1), (n) => n.type === 'table')?.path ?? null;

function sameCell(doc: EditorNode, a: readonly number[], b: readonly number[]): boolean {
    const x = cellOf(doc, a);
    const y = cellOf(doc, b);
    return x === null ? y === null : y !== null && samePath(x, y);
}

function spliceChildren(doc: EditorNode, parentPath: readonly number[], start: number, count: number, nodes: readonly EditorNode[]): EditorNode {
    const parent = parentPath.length ? nodeAt(doc, parentPath)! : doc;
    const content = (parent.content ?? []).slice();
    content.splice(start, count, ...nodes);
    const next = { ...parent, content };
    return parentPath.length ? replaceAt(doc, parentPath, [next]) : next;
}

/** The children of one block container that a range spans. */
function blockRange(doc: EditorNode, from: EditorPosition, to: EditorPosition): { parentPath: number[]; start: number; end: number } {
    const common = commonPrefix(from.path, to.path);
    let parentPath = common.length === from.path.length ? from.path.slice(0, -1) : common;
    while (parentPath.length && !BLOCK_CONTAINERS.has(nodeAt(doc, parentPath)!.type)) parentPath = parentPath.slice(0, -1);
    return { parentPath, start: from.path[parentPath.length]!, end: to.path[parentPath.length]! };
}

interface ListRange {
    listPath: number[];
    list: EditorNode;
    start: number;
    end: number;
}

/** The deepest list holding both ends of a range, and the items the range spans. */
function listRange(doc: EditorNode, from: EditorPosition, to: EditorPosition): ListRange | null {
    const common = commonPrefix(from.path, to.path);
    for (let depth = common.length; depth >= 0; depth--) {
        const path = common.slice(0, depth);
        const node = nodeAt(doc, path);
        if (isList(node)) return { listPath: path, list: node!, start: from.path[depth]!, end: to.path[depth]! };
    }
    return null;
}

function quoteRange(doc: EditorNode, from: EditorPosition, to: EditorPosition) {
    const base = samePath(from.path, to.path) ? from.path.slice(0, -1) : commonPrefix(from.path, to.path);
    return closest(doc, base, (n) => n.type === 'blockquote');
}

const listNode = (type: string, content: EditorNode[], start?: number): EditorNode =>
    type === 'orderedList' ? { type: 'orderedList', attrs: { start: start ?? 1 }, content } : { type: type as EditorNodeType, content };

const itemNode = (type: EditorNodeType, content: EditorNode[]): EditorNode => (type === 'taskItem' ? { type, attrs: { checked: false }, content } : { type, content });

function refsOf(state: EditorState, replaced?: Map<EditorNode, EditorNode>) {
    const refs = selectionRefs(state);
    return replaced ? { anchor: mapRef(refs.anchor, replaced), head: mapRef(refs.head, replaced) } : refs;
}

// ---- deleting ------------------------------------------------------------------------

interface Cut {
    doc: EditorNode;
    path: number[];
    node: EditorNode;
    offset: number;
}

/**
 * Removes everything between two positions. The two end blocks join (the
 * first one's type wins) unless they sit in different table cells; tables
 * wholly inside the range go, cells only partly in it are emptied.
 */
export function deleteRange(doc: EditorNode, from: EditorPosition, to: EditorPosition): Cut {
    const blockA = nodeAt(doc, from.path)!;
    if (samePath(from.path, to.path)) {
        const node = withContent(blockA, replaceInline(blockA.content, from.offset, to.offset, []));
        return { doc: replaceAt(doc, from.path, [node]), path: from.path, node, offset: from.offset };
    }
    const all = leaves(doc);
    const iA = all.findIndex((l) => samePath(l.path, from.path));
    const iB = all.findIndex((l) => samePath(l.path, to.path));
    const blockB = all[iB]!.node;
    const merge = sameCell(doc, from.path, to.path);
    const nodeA = withContent(blockA, merge ? [...sliceInline(blockA.content, 0, from.offset), ...sliceInline(blockB.content, to.offset)] : sliceInline(blockA.content, 0, from.offset));
    const edits: { path: number[]; nodes: EditorNode[] }[] = [{ path: from.path, nodes: [nodeA] }];
    const tables: number[][] = [];
    for (let i = iA + 1; i < iB; i++) {
        const leaf = all[i]!;
        const table = tableOf(doc, leaf.path);
        if (table) {
            if (!isPrefix(table, from.path) && !isPrefix(table, to.path)) {
                if (!tables.some((t) => samePath(t, table))) {
                    tables.push(table);
                    edits.push({ path: table, nodes: [] });
                }
            } else {
                edits.push({ path: leaf.path, nodes: leaf.kind === 'text' ? [withContent(leaf.node, [])] : [] });
            }
            continue;
        }
        edits.push({ path: leaf.path, nodes: [] });
    }
    edits.push({ path: to.path, nodes: merge ? [] : [withContent(blockB, sliceInline(blockB.content, to.offset))] });
    edits.sort((a, b) => comparePaths(b.path, a.path));
    let next = doc;
    for (const edit of edits) next = replaceAt(next, edit.path, edit.nodes);
    return { doc: next, path: from.path, node: nodeA, offset: from.offset };
}

function cutSelection(state: EditorState): Cut {
    const { from, to, empty } = selectionRange(state.selection);
    if (!empty) return deleteRange(state.doc, from, to);
    return { doc: state.doc, path: from.path, node: nodeAt(state.doc, from.path)!, offset: from.offset };
}

export function deleteSelection(state: EditorState): EditorState | null {
    if (selectionRange(state.selection).empty) return null;
    const cut = cutSelection(state);
    return finish(state, cut.doc, { node: cut.node, offset: cut.offset });
}

/** Deletes between two positions — what a browser's `getTargetRanges()` names. */
export function deleteBetween(state: EditorState, from: EditorPosition, to: EditorPosition): EditorState | null {
    const [a, b] = comparePaths(from.path, to.path) < 0 || (samePath(from.path, to.path) && from.offset <= to.offset) ? [from, to] : [to, from];
    if (samePath(a.path, b.path) && a.offset === b.offset) return null;
    const cut = deleteRange(state.doc, a, b);
    return finish(state, cut.doc, { node: cut.node, offset: cut.offset });
}

export function deleteBackward(state: EditorState, unit: DeleteUnit = 'char'): EditorState | null {
    const { from, empty } = selectionRange(state.selection);
    if (!empty) return deleteSelection(state);
    if (from.offset === 0) return joinBackward(state);
    const text = inlineText(nodeAt(state.doc, from.path)!.content);
    let start: number;
    if (unit === 'word') start = previousWordOffset(text, from.offset);
    else if (unit === 'line') {
        start = text.lastIndexOf('\n', from.offset - 1) + 1;
        if (start === from.offset) start--;
    } else start = previousCharOffset(text, from.offset);
    return deleteBetween(state, { path: from.path, offset: start }, from);
}

export function deleteForward(state: EditorState, unit: DeleteUnit = 'char'): EditorState | null {
    const { to, empty } = selectionRange(state.selection);
    if (!empty) return deleteSelection(state);
    const text = inlineText(nodeAt(state.doc, to.path)!.content);
    if (to.offset >= text.length) return joinForward(state);
    let end: number;
    if (unit === 'word') end = nextWordOffset(text, to.offset);
    else if (unit === 'line') {
        end = text.indexOf('\n', to.offset);
        if (end < 0) end = text.length;
        if (end === to.offset) end++;
    } else end = nextCharOffset(text, to.offset);
    return deleteBetween(state, to, { path: to.path, offset: end });
}

/**
 * Backspace at the start of a block: a list item loses a level (or its
 * bullet), a heading or code block turns into a paragraph, a quote's first
 * block leaves the quote; otherwise the block joins the one before it, or an
 * image or rule before it is removed.
 */
export function joinBackward(state: EditorState): EditorState | null {
    const { from, empty } = selectionRange(state.selection);
    if (!empty || from.offset !== 0) return null;
    const { doc } = state;
    const path = from.path;
    const block = nodeAt(doc, path)!;
    const parent = nodeAt(doc, path.slice(0, -1))!;
    const index = last(path);
    if (isItem(parent) && index === 0) return liftListItem(state);
    if (block.type !== 'paragraph') return setBlockType(state, 'paragraph');
    if (parent.type === 'blockquote' && index === 0) return liftOutOfQuote(state, path);
    const all = leaves(doc);
    const previous = all[all.findIndex((l) => samePath(l.path, path)) - 1];
    if (!previous) return null;
    if (previous.kind === 'atom') return finish(state, replaceAt(doc, previous.path, []), { node: block, offset: 0 });
    if (!sameCell(doc, previous.path, path)) return null;
    const cut = deleteRange(doc, { path: previous.path, offset: inlineLength(previous.node.content) }, from);
    return finish(state, cut.doc, { node: cut.node, offset: cut.offset });
}

/** Delete at the end of a block: the next block joins this one, or the image or rule after it goes. */
export function joinForward(state: EditorState): EditorState | null {
    const { to, empty } = selectionRange(state.selection);
    const { doc } = state;
    const block = nodeAt(doc, to.path)!;
    if (!empty || to.offset !== inlineLength(block.content)) return null;
    const all = leaves(doc);
    const next = all[all.findIndex((l) => samePath(l.path, to.path)) + 1];
    if (!next) return null;
    if (next.kind === 'atom') return finish(state, replaceAt(doc, next.path, []), { node: block, offset: to.offset });
    if (!sameCell(doc, next.path, to.path)) return null;
    const cut = deleteRange(doc, to, { path: next.path, offset: 0 });
    return finish(state, cut.doc, { node: cut.node, offset: cut.offset });
}

/** Removes the image or rule at `path`. */
export function deleteNode(state: EditorState, path: number[]): EditorState | null {
    const node = nodeAt(state.doc, path);
    if (!node || !isAtom(node)) return null;
    const blocks = textblocks(state.doc);
    const after = blocks.find((b) => comparePaths(b.path, path) > 0) ?? last(blocks);
    return finish(state, replaceAt(state.doc, path, []), { node: after.node, offset: 0 });
}

// ---- typing ----------------------------------------------------------------------------

export function insertText(state: EditorState, text: string, marks?: EditorMark[]): EditorState | null {
    if (!text) return null;
    const { from, empty } = selectionRange(state.selection);
    const original = nodeAt(state.doc, from.path)!;
    const inherited = marks ?? state.storedMarks ?? (empty ? marksAt(original.content, from.offset) : marksAfter(original.content, from.offset));
    const cut = cutSelection(state);
    const clean = text.replace(/\r\n?/g, '\n');
    const insert: EditorNode[] = cut.node.type === 'codeBlock' ? [{ type: 'text', text: clean }] : textToInline(clean, inherited);
    const node = withContent(cut.node, replaceInline(cut.node.content, cut.offset, cut.offset, insert));
    return finish(state, replaceAt(cut.doc, cut.path, [node]), { node, offset: cut.offset + inlineLength(insert) });
}

export function insertHardBreak(state: EditorState): EditorState | null {
    const { from } = selectionRange(state.selection);
    const block = nodeAt(state.doc, from.path)!;
    if (block.type === 'codeBlock') return insertText(state, '\n');
    const marks = state.storedMarks ?? marksAt(block.content, from.offset);
    const cut = cutSelection(state);
    const node = withContent(cut.node, replaceInline(cut.node.content, cut.offset, cut.offset, [{ type: 'hardBreak' }]));
    return finish(state, replaceAt(cut.doc, cut.path, [node]), { node, offset: cut.offset + 1 }, undefined, marks.length ? marks : null);
}

/**
 * Enter: splits the block (a list item into two items). In an empty list item
 * it leaves the list, in an empty last block of a quote it leaves the quote,
 * in a code block it adds a line — and Enter on an empty last line leaves it.
 */
export function splitBlock(state: EditorState): EditorState | null {
    const cut = cutSelection(state);
    let { doc } = cut;
    const { node: block, path, offset } = cut;
    const length = inlineLength(block.content);
    if (block.type === 'codeBlock') {
        const text = inlineText(block.content);
        // Enter on an empty last line leaves the block, taking that line with it.
        if (offset === length && text.endsWith('\n')) {
            const code = withContent(block, [{ type: 'text', text: text.slice(0, -1) }]);
            const paragraph = emptyParagraph();
            return finish(state, replaceAt(doc, path, [code, paragraph]), { node: paragraph, offset: 0 });
        }
        const node = withContent(block, replaceInline(block.content, offset, offset, [{ type: 'text', text: '\n' }]));
        return finish(state, replaceAt(doc, path, [node]), { node, offset: offset + 1 });
    }
    const parentPath = path.slice(0, -1);
    const parent = nodeAt(doc, parentPath)!;
    const index = last(path);
    const collapsed: EditorState = { ...state, doc, selection: caret(path, offset) };
    if (length === 0 && isItem(parent) && index === 0 && parent.content!.length === 1) return liftListItem(collapsed);
    if (length === 0 && parent.type === 'blockquote' && index === parent.content!.length - 1 && block.type === 'paragraph') return liftOutOfQuote(collapsed, path);
    const marks = state.storedMarks ?? marksAt(block.content, offset);
    const heading = block.type === 'heading';
    const left = heading && offset === 0 && length > 0 ? makeTextblock('paragraph', undefined, []) : withContent(block, sliceInline(block.content, 0, offset));
    const right = heading && offset === length ? emptyParagraph() : withContent(block, sliceInline(block.content, offset));
    if (isItem(parent) && index === 0) {
        const first = { ...parent, content: [left] };
        const second = itemNode(parent.type, [right, ...parent.content!.slice(1)]);
        doc = replaceAt(doc, parentPath, [first, second]);
    } else {
        doc = replaceAt(doc, path, [left, right]);
    }
    return finish(state, doc, { node: right, offset: 0 }, undefined, marks.length ? marks : null);
}

// ---- block types --------------------------------------------------------------------------

const sameBlockType = (node: EditorNode, type: EditorNodeType, attrs?: EditorNodeAttrs) =>
    node.type === type && (type !== 'heading' || attrs?.level === undefined || node.attrs?.level === attrs.level);

export function setBlockType(state: EditorState, type: EditorNodeType, attrs?: EditorNodeAttrs): EditorState | null {
    if (type !== 'paragraph' && type !== 'heading' && type !== 'codeBlock') return null;
    const { from, to } = selectionRange(state.selection);
    const replaced = new Map<EditorNode, EditorNode>();
    let doc = state.doc;
    for (const b of blocksInRange(state.doc, from, to)) {
        const sameLanguage = type !== 'codeBlock' || attrs?.language === undefined || (b.node.attrs?.language ?? null) === (attrs.language ?? null);
        if (sameBlockType(b.node, type, attrs) && sameLanguage) continue;
        const next = makeTextblock(type, { ...attrs, language: type === 'codeBlock' ? sanitizeLanguage(attrs?.language ?? b.node.attrs?.language) : undefined }, b.node.content ?? []);
        replaced.set(b.node, next);
        doc = replaceAt(doc, b.path, [next]);
    }
    if (!replaced.size) return null;
    const refs = refsOf(state, replaced);
    return finish(state, doc, refs.anchor, refs.head, state.storedMarks);
}

/** Sets the type, or goes back to a paragraph when every block already has it. */
export function toggleBlockType(state: EditorState, type: EditorNodeType, attrs?: EditorNodeAttrs): EditorState | null {
    const { from, to } = selectionRange(state.selection);
    const blocks = blocksInRange(state.doc, from, to);
    const all = blocks.length > 0 && blocks.every((b) => sameBlockType(b.node, type, attrs ?? (type === 'heading' ? { level: 1 } : undefined)));
    return setBlockType(state, all ? 'paragraph' : type, all ? undefined : attrs);
}

export function setCodeBlockLanguage(state: EditorState, language: string | null): EditorState | null {
    const { from } = selectionRange(state.selection);
    const block = nodeAt(state.doc, from.path)!;
    if (block.type !== 'codeBlock') return null;
    const next = makeTextblock('codeBlock', { language: sanitizeLanguage(language) }, block.content ?? []);
    const replaced = new Map([[block, next]]);
    const refs = refsOf(state, replaced);
    return finish(state, replaceAt(state.doc, from.path, [next]), refs.anchor, refs.head, state.storedMarks);
}

// ---- marks ---------------------------------------------------------------------------------

function applyMark(state: EditorState, mark: EditorMark | null, type: EditorMarkType, ranges?: { path: number[]; node: EditorNode; from: number; to: number }[]): EditorState | null {
    const { from, to } = selectionRange(state.selection);
    const blocks = (ranges ?? blocksInRange(state.doc, from, to)).filter((b) => b.node.type !== 'codeBlock' && b.from < b.to);
    if (!blocks.length) return null;
    const replaced = new Map<EditorNode, EditorNode>();
    let doc = state.doc;
    for (const b of blocks) {
        const content = mark ? addMarkInline(b.node.content, b.from, b.to, mark) : removeMarkInline(b.node.content, b.from, b.to, type);
        const next = withContent(b.node, content);
        replaced.set(b.node, next);
        doc = replaceAt(doc, b.path, [next]);
    }
    const refs = refsOf(state, replaced);
    return finish(state, doc, refs.anchor, refs.head, state.storedMarks);
}

function currentMarks(state: EditorState): EditorMark[] {
    const { from } = selectionRange(state.selection);
    return state.storedMarks ?? marksAt(nodeAt(state.doc, from.path)!.content, from.offset);
}

/** Adds the mark to the selection, or removes it when all of it already has it. With nothing selected, it applies to what is typed next. */
export function toggleMark(state: EditorState, type: EditorMarkType, attrs?: EditorMarkAttrs): EditorState | null {
    const { from, to, empty } = selectionRange(state.selection);
    if (empty) {
        if (nodeAt(state.doc, from.path)!.type === 'codeBlock') return null;
        const marks = currentMarks(state);
        return { ...state, storedMarks: hasMark(marks, type) ? removeFromSet(marks, type) : addToSet(marks, attrs ? { type, attrs } : { type }) };
    }
    const blocks = blocksInRange(state.doc, from, to).filter((b) => b.node.type !== 'codeBlock' && b.from < b.to);
    const all = blocks.length > 0 && blocks.every((b) => rangeHasMark(b.node.content, b.from, b.to, type));
    return applyMark(state, all ? null : attrs ? { type, attrs } : { type }, type);
}

export function setMark(state: EditorState, mark: EditorMark): EditorState | null {
    const { from, empty } = selectionRange(state.selection);
    if (empty) {
        if (nodeAt(state.doc, from.path)!.type === 'codeBlock') return null;
        return { ...state, storedMarks: addToSet(currentMarks(state), mark) };
    }
    return applyMark(state, mark, mark.type);
}

export function unsetMark(state: EditorState, type: EditorMarkType): EditorState | null {
    const { empty } = selectionRange(state.selection);
    if (empty) {
        const marks = currentMarks(state);
        return hasMark(marks, type) ? { ...state, storedMarks: removeFromSet(marks, type) } : null;
    }
    return applyMark(state, null, type);
}

export const setColor = (state: EditorState, color: string | null): EditorState | null => (color ? setMark(state, { type: 'color', attrs: { color } }) : unsetMark(state, 'color'));
export const setHighlight = (state: EditorState, color: string | null): EditorState | null =>
    color ? setMark(state, { type: 'highlight', attrs: { color } }) : unsetMark(state, 'highlight');

export interface EditorLinkInfo {
    href: string;
    target: string | null;
    /** The linked text. */
    text: string;
}

/** The link the selection starts in (or the caret touches), if any. */
export function linkAt(state: EditorState): EditorLinkInfo | null {
    const { from, empty } = selectionRange(state.selection);
    const block = nodeAt(state.doc, from.path)!;
    let extent: ReturnType<typeof markExtent>;
    if (empty) extent = markExtent(block.content, from.offset, 'link');
    else if (marksAfter(block.content, from.offset).some((m) => m.type === 'link')) extent = markExtent(block.content, from.offset + 1, 'link');
    else extent = null;
    if (!extent) return null;
    return { href: extent.mark.attrs?.href ?? '', target: extent.mark.attrs?.target ?? null, text: inlineText(sliceInline(block.content, extent.from, extent.to)) };
}

/**
 * Links the selection; with nothing selected, updates the link the caret is
 * in, or inserts `text` (the URL itself by default) as a new link. An unsafe
 * URL is refused.
 */
export function setLink(state: EditorState, href: string | null, options: { text?: string; target?: string | null } = {}): EditorState | null {
    if (href === null || href === '') return unsetLink(state);
    const safe = sanitizeUrl(href, 'link');
    if (!safe) return null;
    const mark: EditorMark = { type: 'link', attrs: { href: safe, target: options.target === '_blank' ? '_blank' : null } };
    const { from, empty } = selectionRange(state.selection);
    const block = nodeAt(state.doc, from.path)!;
    if (block.type === 'codeBlock') return null;
    if (!empty) return applyMark(state, mark, 'link');
    const extent = markExtent(block.content, from.offset, 'link');
    if (extent) {
        const current = inlineText(sliceInline(block.content, extent.from, extent.to));
        if (options.text && options.text !== current) {
            const range = { anchor: { path: from.path, offset: extent.from }, head: { path: from.path, offset: extent.to } };
            return insertText({ ...state, selection: range, storedMarks: null }, options.text, addToSet(marksAfter(block.content, extent.from), mark));
        }
        return applyMark(state, mark, 'link', [{ path: from.path, node: block, from: extent.from, to: extent.to }]);
    }
    const marks = addToSet(marksAt(block.content, from.offset), mark);
    return insertText({ ...state, storedMarks: null }, options.text || safe, marks);
}

/** Removes the link from the selection, or from the whole link the caret is in. */
export function unsetLink(state: EditorState): EditorState | null {
    const { from, to, empty } = selectionRange(state.selection);
    const blocks = blocksInRange(state.doc, from, to);
    const first = blocks[0]!;
    const lastBlock = last(blocks);
    const startExtent = markExtent(first.node.content, from.offset, 'link');
    const endExtent = markExtent(lastBlock.node.content, to.offset, 'link');
    if (empty && !startExtent) return null;
    if (startExtent) first.from = Math.min(first.from, startExtent.from);
    if (endExtent) lastBlock.to = Math.max(lastBlock.to, endExtent.to);
    if (empty) first.to = Math.max(first.to, startExtent!.to);
    const hasLink = blocks.some((b) => b.from < b.to && sliceInline(b.node.content, b.from, b.to).some((n) => hasMark(n.marks, 'link')));
    if (!hasLink) return null;
    return applyMark(state, null, 'link', blocks);
}

// ---- lists and quotes -------------------------------------------------------------------

function wrapRange(state: EditorState, wrap: (children: EditorNode[]) => EditorNode): EditorState | null {
    const { from, to } = selectionRange(state.selection);
    const range = blockRange(state.doc, from, to);
    const parent = range.parentPath.length ? nodeAt(state.doc, range.parentPath)! : state.doc;
    const children = parent.content!.slice(range.start, range.end + 1);
    const doc = spliceChildren(state.doc, range.parentPath, range.start, children.length, [wrap(children)]);
    const refs = refsOf(state);
    return finish(state, doc, refs.anchor, refs.head, state.storedMarks);
}

/** Moves list items out a level: into the parent list, or out of the list altogether at the top. */
function liftItems(state: EditorState, range: ListRange, unwrap: boolean): EditorState {
    const { listPath, list, start, end } = range;
    const parentPath = listPath.slice(0, -1);
    const parent = nodeAt(state.doc, parentPath)!;
    const before = list.content!.slice(0, start);
    const selected = list.content!.slice(start, end + 1);
    const after = list.content!.slice(end + 1);
    const listIndex = last(listPath);
    let doc: EditorNode;
    if (isItem(parent) && !unwrap) {
        const grand = nodeAt(state.doc, parentPath.slice(0, -1))!;
        const kept = { ...parent, content: [...parent.content!.slice(0, listIndex), ...(before.length ? [{ ...list, content: before }] : []), ...parent.content!.slice(listIndex + 1)] };
        const moved = selected.map((item) => convertItem(item, itemTypeOf(grand.type)));
        if (after.length) {
            const tail = last(moved);
            moved[moved.length - 1] = { ...tail, content: [...tail.content!, { ...list, content: after }] };
        }
        doc = replaceAt(state.doc, parentPath, [kept, ...moved]);
    } else {
        const blocks = selected.flatMap((item) => item.content ?? []);
        const nextStart = (list.attrs?.start ?? 1) + before.length + selected.length;
        doc = replaceAt(state.doc, listPath, [
            ...(before.length ? [{ ...list, content: before }] : []),
            ...blocks,
            ...(after.length ? [list.type === 'orderedList' ? { ...list, attrs: { start: nextStart }, content: after } : { ...list, content: after }] : [])
        ]);
    }
    const refs = refsOf(state);
    return finish(state, doc, refs.anchor, refs.head, state.storedMarks);
}

export function toggleList(state: EditorState, type: 'bulletList' | 'orderedList' | 'taskList'): EditorState | null {
    const { from, to } = selectionRange(state.selection);
    const range = listRange(state.doc, from, to);
    if (range) {
        if (range.list.type === type) return liftItems(state, range, true);
        const converted = listNode(type, range.list.content!.map((item) => convertItem(item, itemTypeOf(type))), range.list.attrs?.start);
        const refs = refsOf(state);
        return finish(state, replaceAt(state.doc, range.listPath, [converted]), refs.anchor, refs.head, state.storedMarks);
    }
    const itemType = itemTypeOf(type);
    return wrapRange(state, (children) =>
        listNode(
            type,
            children.flatMap((child) => (isList(child) ? child.content!.map((item) => convertItem(item, itemType)) : [itemNode(itemType, [child])]))
        )
    );
}

export function liftListItem(state: EditorState): EditorState | null {
    const { from, to } = selectionRange(state.selection);
    const range = listRange(state.doc, from, to);
    return range ? liftItems(state, range, false) : null;
}

export function sinkListItem(state: EditorState): EditorState | null {
    const { from, to } = selectionRange(state.selection);
    const range = listRange(state.doc, from, to);
    if (!range || range.start === 0) return null;
    const { listPath, list, start, end } = range;
    const previous = list.content![start - 1]!;
    const sub = listNode(list.type, list.content!.slice(start, end + 1));
    const content = [...list.content!.slice(0, start - 1), { ...previous, content: [...previous.content!, sub] }, ...list.content!.slice(end + 1)];
    const refs = refsOf(state);
    return finish(state, replaceAt(state.doc, listPath, [{ ...list, content }]), refs.anchor, refs.head, state.storedMarks);
}

export function toggleBlockquote(state: EditorState): EditorState | null {
    const { from, to } = selectionRange(state.selection);
    const quote = quoteRange(state.doc, from, to);
    if (quote) {
        const refs = refsOf(state);
        return finish(state, replaceAt(state.doc, quote.path, quote.node.content ?? []), refs.anchor, refs.head, state.storedMarks);
    }
    return wrapRange(state, (children) => ({ type: 'blockquote', content: children }));
}

function liftOutOfQuote(state: EditorState, path: number[]): EditorState | null {
    const quotePath = path.slice(0, -1);
    const quote = nodeAt(state.doc, quotePath)!;
    const index = last(path);
    const child = quote.content![index]!;
    const before = quote.content!.slice(0, index);
    const after = quote.content!.slice(index + 1);
    const nodes = [...(before.length ? [{ ...quote, content: before }] : []), child, ...(after.length ? [{ ...quote, content: after }] : [])];
    const refs = refsOf(state);
    return finish(state, replaceAt(state.doc, quotePath, nodes), refs.anchor, refs.head, state.storedMarks);
}

export function toggleTaskItem(state: EditorState, path?: number[]): EditorState | null {
    const target = path ? { node: nodeAt(state.doc, path), path } : closest(state.doc, selectionRange(state.selection).from.path, (n) => n.type === 'taskItem');
    if (!target?.node || target.node.type !== 'taskItem') return null;
    const next = { ...target.node, attrs: { checked: !target.node.attrs?.checked } };
    const refs = refsOf(state);
    return finish(state, replaceAt(state.doc, target.path, [next]), refs.anchor, refs.head, state.storedMarks);
}

// ---- code -------------------------------------------------------------------------------

const INDENT = '  ';

/** Tab in a code block: indents the selected lines, or inserts two spaces at the caret. */
export function indentCode(state: EditorState): EditorState | null {
    const { from, to, empty } = selectionRange(state.selection);
    const block = nodeAt(state.doc, from.path)!;
    if (block.type !== 'codeBlock' || !samePath(from.path, to.path)) return null;
    if (empty) return insertText(state, INDENT);
    return shiftLines(state, block, from.offset, to.offset, (line) => ({ text: INDENT + line, delta: INDENT.length }));
}

/** Shift+Tab in a code block: removes up to two spaces from the start of each selected line. */
export function outdentCode(state: EditorState): EditorState | null {
    const { from, to } = selectionRange(state.selection);
    const block = nodeAt(state.doc, from.path)!;
    if (block.type !== 'codeBlock' || !samePath(from.path, to.path)) return null;
    return shiftLines(state, block, from.offset, to.offset, (line) => {
        const n = line.match(/^ {0,2}/)![0].length;
        return { text: line.slice(n), delta: -n };
    });
}

function shiftLines(state: EditorState, block: EditorNode, from: number, to: number, fn: (line: string) => { text: string; delta: number }): EditorState | null {
    const text = inlineText(block.content);
    const lines = text.split('\n');
    let pos = 0;
    let anchorShift = 0;
    let headShift = 0;
    let changed = false;
    const { anchor, head } = state.selection;
    const out = lines.map((line) => {
        const start = pos;
        const end = pos + line.length;
        pos = end + 1;
        if (end < from || start > to) return line;
        const { text: next, delta } = fn(line);
        if (delta) changed = true;
        if (anchor.offset >= start) anchorShift += Math.max(delta, start - anchor.offset);
        if (head.offset >= start) headShift += Math.max(delta, start - head.offset);
        return next;
    });
    if (!changed) return null;
    const next = withContent(block, [{ type: 'text', text: out.join('\n') }]);
    const doc = replaceAt(state.doc, anchor.path, [next]);
    return finish(state, doc, { node: next, offset: anchor.offset + anchorShift }, { node: next, offset: head.offset + headShift });
}

// ---- inserting blocks ---------------------------------------------------------------------

/** Puts a block (a rule, an image, a table) at the caret, splitting the text block there; the caret lands after it. */
export function insertBlock(state: EditorState, node: EditorNode): EditorState | null {
    const cut = cutSelection(state);
    const { node: block, path, offset } = cut;
    if (block.type === 'codeBlock') return null;
    const parent = nodeAt(cut.doc, path.slice(0, -1))!;
    const firstOfItem = isItem(parent) && last(path) === 0;
    const length = inlineLength(block.content);
    const left = withContent(block, sliceInline(block.content, 0, offset));
    const right = block.type === 'heading' && offset === length ? emptyParagraph() : withContent(block, sliceInline(block.content, offset));
    const nodes = [...(offset > 0 || firstOfItem ? [left] : []), node, right];
    const doc = replaceAt(cut.doc, path, nodes);
    const inside = node.type === 'table' ? textblocks({ type: 'doc', content: [node] })[0]?.node : undefined;
    return finish(state, doc, { node: inside ?? right, offset: 0 });
}

export const insertHorizontalRule = (state: EditorState): EditorState | null => insertBlock(state, { type: 'horizontalRule' });

export function insertImage(state: EditorState, image: { src: string; alt?: string; title?: string | null }): EditorState | null {
    const src = sanitizeUrl(image.src, 'image');
    if (!src) return null;
    return insertBlock(state, { type: 'image', attrs: { src, alt: image.alt ?? '', title: image.title || null } });
}

export function insertTable(state: EditorState, rows = 3, cols = 3, withHeaderRow = true): EditorState | null {
    const r = Math.max(1, Math.min(50, Math.round(rows)));
    const c = Math.max(1, Math.min(20, Math.round(cols)));
    const table: EditorNode = {
        type: 'table',
        content: Array.from({ length: r }, (_, i) => ({
            type: 'tableRow' as const,
            content: Array.from({ length: c }, () => ({ type: (withHeaderRow && i === 0 ? 'tableHeader' : 'tableCell') as EditorNodeType, content: [emptyParagraph()] }))
        }))
    };
    return insertBlock(state, table);
}

// ---- tables ---------------------------------------------------------------------------------

interface TableContext {
    path: number[];
    table: EditorNode;
    row: number;
    col: number;
}

function tableAt(state: EditorState): TableContext | null {
    const { from } = selectionRange(state.selection);
    const found = closest(state.doc, from.path, (n) => n.type === 'table');
    if (!found) return null;
    return { path: found.path, table: found.node, row: from.path[found.path.length]!, col: from.path[found.path.length + 1]! };
}

function withTable(state: EditorState, ctx: TableContext, rows: EditorNode[], focus?: { row: number; col: number }): EditorState {
    const table = { ...ctx.table, content: rows };
    const doc = rows.length && rows[0]!.content!.length ? replaceAt(state.doc, ctx.path, [table]) : replaceAt(state.doc, ctx.path, []);
    if (focus && rows[focus.row]?.content?.[focus.col]) {
        const block = textblocks({ type: 'doc', content: [rows[focus.row]!.content![focus.col]!] })[0];
        if (block) return finish(state, doc, { node: block.node, offset: 0 });
    }
    const refs = refsOf(state);
    return finish(state, doc, refs.anchor, refs.head);
}

const newCell = (type: EditorNodeType = 'tableCell'): EditorNode => ({ type, content: [emptyParagraph()] });

export function addRow(state: EditorState, after = true, focusColumn?: number): EditorState | null {
    const ctx = tableAt(state);
    if (!ctx) return null;
    const rows = ctx.table.content!.slice();
    const width = rows[0]!.content!.length;
    const index = after ? ctx.row + 1 : ctx.row;
    rows.splice(index, 0, { type: 'tableRow', content: Array.from({ length: width }, () => newCell()) });
    return withTable(state, ctx, rows, { row: index, col: focusColumn ?? ctx.col });
}

export function addColumn(state: EditorState, after = true): EditorState | null {
    const ctx = tableAt(state);
    if (!ctx) return null;
    const index = after ? ctx.col + 1 : ctx.col;
    const rows = ctx.table.content!.map((row) => {
        const cells = row.content!.slice();
        cells.splice(index, 0, newCell(row.content![ctx.col]?.type ?? 'tableCell'));
        return { ...row, content: cells };
    });
    return withTable(state, ctx, rows, { row: ctx.row, col: index });
}

export function deleteRow(state: EditorState): EditorState | null {
    const ctx = tableAt(state);
    if (!ctx) return null;
    const rows = ctx.table.content!.filter((_, i) => i !== ctx.row);
    return withTable(state, ctx, rows, rows.length ? { row: Math.min(ctx.row, rows.length - 1), col: ctx.col } : undefined);
}

export function deleteColumn(state: EditorState): EditorState | null {
    const ctx = tableAt(state);
    if (!ctx) return null;
    const rows = ctx.table.content!.map((row) => ({ ...row, content: row.content!.filter((_, i) => i !== ctx.col) }));
    const width = rows[0]!.content!.length;
    return withTable(state, ctx, width ? rows : [], width ? { row: ctx.row, col: Math.min(ctx.col, width - 1) } : undefined);
}

export function deleteTable(state: EditorState): EditorState | null {
    const ctx = tableAt(state);
    return ctx ? withTable(state, ctx, []) : null;
}

/** Tab and Shift+Tab in a table; Tab in the last cell adds a row. */
export function goToCell(state: EditorState, direction: 1 | -1): EditorState | null {
    const ctx = tableAt(state);
    if (!ctx) return null;
    const width = ctx.table.content![0]!.content!.length;
    const flat = ctx.row * width + ctx.col + direction;
    if (flat < 0) return null;
    if (flat >= ctx.table.content!.length * width) return addRow(state, true, 0);
    const cellNode = ctx.table.content![Math.floor(flat / width)]!.content![flat % width]!;
    const target = textblocks({ type: 'doc', content: [cellNode] })[0]!;
    // The cell's text is selected, so typing replaces it — as a spreadsheet does.
    return finish(state, state.doc, { node: target.node, offset: 0 }, { node: target.node, offset: inlineLength(target.node.content) });
}

// ---- everything else ----------------------------------------------------------------------

export function clearFormatting(state: EditorState): EditorState | null {
    const { from, to, empty } = selectionRange(state.selection);
    const replaced = new Map<EditorNode, EditorNode>();
    let doc = state.doc;
    for (const b of blocksInRange(state.doc, from, to)) {
        const content = empty ? (b.node.content ?? []) : removeMarkInline(b.node.content, b.from, b.to, null);
        const next = makeTextblock('paragraph', undefined, content);
        replaced.set(b.node, next);
        doc = replaceAt(doc, b.path, [next]);
    }
    const refs = refsOf(state, replaced);
    return finish(state, doc, refs.anchor, refs.head, empty ? [] : null);
}

/** Plain text of some blocks, a line per block. */
export function fragmentText(nodes: readonly EditorNode[]): string {
    return textblocks({ type: 'doc', content: [...nodes] })
        .map((b) => inlineText(b.node.content))
        .join('\n');
}

/**
 * Inserts parsed content (pasted or dropped) at the selection. A single text
 * block goes in as inline content; several blocks split the block at the
 * caret, the first and last joining its two halves.
 */
export function insertContent(state: EditorState, fragment: readonly EditorNode[]): EditorState | null {
    const nodes = fragment.filter((n, i) => !(i === fragment.length - 1 && i > 0 && n.type === 'paragraph' && !n.content?.length && !isTextblock(fragment[i - 1])));
    if (!nodes.length) return null;
    const cut = cutSelection(state);
    const { node: block, path, offset } = cut;
    const after: EditorState = { ...state, doc: cut.doc, selection: caret(path, offset) };
    if (block.type === 'codeBlock') return insertText(after, fragmentText(nodes));
    if (nodes.length === 1 && isTextblock(nodes[0])) {
        const first = nodes[0]!;
        const content = first.type === 'codeBlock' ? textToInline(inlineText(first.content)) : (first.content ?? []);
        if (!content.length) return cut.doc === state.doc ? null : finish(state, cut.doc, { node: block, offset });
        const node = withContent(block, replaceInline(block.content, offset, offset, content));
        return finish(state, replaceAt(cut.doc, path, [node]), { node, offset: offset + inlineLength(content) });
    }
    const parent = nodeAt(cut.doc, path.slice(0, -1))!;
    const firstOfItem = isItem(parent) && last(path) === 0;
    const length = inlineLength(block.content);
    const leftContent = sliceInline(block.content, 0, offset);
    const rightContent = sliceInline(block.content, offset);
    const middle = nodes.slice();
    const head = middle[0]!;
    let left: EditorNode | null;
    if (isTextblock(head)) {
        middle.shift();
        left = offset === 0 && length === 0 && block.type === 'paragraph' && !firstOfItem ? head : withContent(block, [...leftContent, ...(head.type === 'codeBlock' ? textToInline(inlineText(head.content)) : (head.content ?? []))]);
        // A fresh object, so the selection can find it.
        left = makeTextblock(left.type, left.attrs, left.content ?? []);
    } else {
        left = offset > 0 || firstOfItem ? withContent(block, leftContent) : null;
    }
    let right: EditorNode | null;
    let cursor: NodeRef;
    const tail = middle[middle.length - 1];
    if (tail && isTextblock(tail)) {
        middle.pop();
        right = makeTextblock(tail.type, tail.attrs, [...(tail.content ?? []), ...(tail.type === 'codeBlock' ? [] : rightContent)]);
        if (tail.type === 'codeBlock' && rightContent.length) {
            const rest = withContent(block, rightContent);
            middle.push(right);
            right = rest;
            cursor = { node: rest, offset: 0 };
        } else cursor = { node: right, offset: inlineLength(tail.content) };
    } else if (!tail && left) {
        // Only the first block was text: it joined the left half; the right half follows.
        right = withContent(block, rightContent);
        cursor = { node: right, offset: 0 };
        if (!rightContent.length) {
            cursor = { node: left, offset: inlineLength(left.content) };
            right = null;
        }
    } else {
        const lastBlock = tail ? textblocks({ type: 'doc', content: [tail] }).at(-1) : undefined;
        if (!rightContent.length && lastBlock && !isAtom(tail) && tail!.type !== 'table') {
            right = null;
            cursor = { node: lastBlock.node, offset: inlineLength(lastBlock.node.content) };
        } else {
            right = block.type === 'heading' && !rightContent.length ? emptyParagraph() : withContent(block, rightContent);
            cursor = { node: right, offset: 0 };
        }
    }
    const placed = [...(left ? [left] : []), ...middle, ...(right ? [right] : [])];
    return finish(state, replaceAt(cut.doc, path, placed), cursor);
}

export function selectAll(state: EditorState): EditorState {
    return { ...state, selection: { anchor: startOfDoc(state.doc), head: endOfDoc(state.doc) }, storedMarks: null };
}

export function setSelection(state: EditorState, selection: EditorSelection): EditorState {
    return { ...state, selection, storedMarks: null };
}

// ---- queries ---------------------------------------------------------------------------------

/** Whether a mark, block type, list or quote is on at the selection — what a toggle button shows. */
export function isActive(state: EditorState, name: string, attrs?: EditorMarkAttrs & EditorNodeAttrs): boolean {
    const { from, to, empty } = selectionRange(state.selection);
    switch (name) {
        case 'bold':
        case 'italic':
        case 'underline':
        case 'strike':
        case 'code':
        case 'color':
        case 'highlight': {
            const type = name as EditorMarkType;
            const matches = (m: EditorMark) => m.type === type && (!attrs?.color || m.attrs?.color === attrs.color);
            if (empty) return currentMarks(state).some(matches);
            const blocks = blocksInRange(state.doc, from, to).filter((b) => b.from < b.to && b.node.type !== 'codeBlock');
            return blocks.length > 0 && blocks.every((b) => rangeHasMark(b.node.content, b.from, b.to, type, attrs?.color ? { color: attrs.color } : undefined));
        }
        case 'link':
            return linkAt(state) !== null;
        case 'paragraph':
        case 'heading':
        case 'codeBlock': {
            const blocks = blocksInRange(state.doc, from, to);
            return blocks.length > 0 && blocks.every((b) => sameBlockType(b.node, name, attrs));
        }
        case 'bulletList':
        case 'orderedList':
        case 'taskList':
            return listRange(state.doc, from, to)?.list.type === name;
        case 'blockquote':
            return quoteRange(state.doc, from, to) !== null;
        case 'table':
            return tableAt(state) !== null;
        default:
            return false;
    }
}

/** The attributes of the mark of `type` at the selection (a colour's name, a link's href). */
export function activeMark(state: EditorState, type: EditorMarkType): EditorMark | null {
    const { from, empty } = selectionRange(state.selection);
    const block = nodeAt(state.doc, from.path)!;
    const marks = empty ? currentMarks(state) : marksAfter(block.content, from.offset);
    return marks.find((m) => m.type === type) ?? null;
}

/** The current block type, for a block-type picker: `'paragraph'`, `'heading1'`…, `'codeBlock'`. */
export function activeBlockType(state: EditorState): string {
    const { from } = selectionRange(state.selection);
    const block = nodeAt(state.doc, from.path)!;
    return block.type === 'heading' ? `heading${block.attrs?.level ?? 1}` : block.type;
}


import {
    comparePositions,
    inlineLength,
    leaves,
    nodeAt,
    normalizeDoc,
    pathOf,
    samePath,
    textblocks,
    type EditorMark,
    type EditorNode,
    type EditorPosition
} from './model';

export interface EditorSelection {
    /** Where the selection started. */
    anchor: EditorPosition;
    /** Where it ends — the caret. */
    head: EditorPosition;
}

export interface EditorState {
    doc: EditorNode;
    selection: EditorSelection;
    /** Marks the next typed text takes, set by toggling a mark with nothing selected. */
    storedMarks: EditorMark[] | null;
}

/** A pure edit: the next state, or null when it does not apply here. */
export type EditorCommand<Args extends unknown[] = []> = (state: EditorState, ...args: Args) => EditorState | null;

export const caret = (path: number[], offset: number): EditorSelection => ({ anchor: { path, offset }, head: { path, offset } });

export function startOfDoc(doc: EditorNode): EditorPosition {
    const first = textblocks(doc)[0];
    return { path: first?.path ?? [0], offset: 0 };
}

export function endOfDoc(doc: EditorNode): EditorPosition {
    const all = textblocks(doc);
    const last = all[all.length - 1];
    return last ? { path: last.path, offset: inlineLength(last.node.content) } : { path: [0], offset: 0 };
}

export function createState(doc: EditorNode, selection?: EditorSelection): EditorState {
    const normalized = normalizeDoc(doc);
    const start = startOfDoc(normalized);
    return { doc: normalized, selection: clampSelection(normalized, selection ?? { anchor: start, head: start }), storedMarks: null };
}

/** A position moved onto the nearest text block and inside its length. */
export function clampPosition(doc: EditorNode, pos: EditorPosition): EditorPosition {
    const node = nodeAt(doc, pos.path);
    if (node && (node.type === 'paragraph' || node.type === 'heading' || node.type === 'codeBlock')) {
        return { path: pos.path, offset: Math.max(0, Math.min(pos.offset, inlineLength(node.content))) };
    }
    const blocks = textblocks(doc);
    // The first text block at or after the path, else the last one.
    const after = blocks.find((b) => comparePositions({ path: b.path, offset: 0 }, { path: pos.path, offset: 0 }) >= 0);
    const target = after ?? blocks[blocks.length - 1];
    if (!target) return { path: [0], offset: 0 };
    return { path: target.path, offset: after ? 0 : inlineLength(target.node.content) };
}

export function clampSelection(doc: EditorNode, sel: EditorSelection): EditorSelection {
    return { anchor: clampPosition(doc, sel.anchor), head: clampPosition(doc, sel.head) };
}

export function selectionRange(sel: EditorSelection): { from: EditorPosition; to: EditorPosition; empty: boolean } {
    const forward = comparePositions(sel.anchor, sel.head) <= 0;
    const from = forward ? sel.anchor : sel.head;
    const to = forward ? sel.head : sel.anchor;
    return { from, to, empty: comparePositions(from, to) === 0 };
}

export const isCollapsed = (sel: EditorSelection): boolean => comparePositions(sel.anchor, sel.head) === 0;

export const sameSelection = (a: EditorSelection, b: EditorSelection): boolean => comparePositions(a.anchor, b.anchor) === 0 && comparePositions(a.head, b.head) === 0;

/** A position held by its text block's identity, which survives reshaping of the tree around it. */
export interface NodeRef {
    node: EditorNode;
    offset: number;
}

/**
 * The end of every command: normalise the new tree and find the selection's
 * blocks again by identity. `replaced` maps blocks of the old tree to their
 * replacements, for commands that rebuilt the blocks the selection was in.
 */
export function finish(
    state: EditorState,
    doc: EditorNode,
    anchor: NodeRef,
    head: NodeRef = anchor,
    storedMarks: EditorMark[] | null = null
): EditorState {
    const normalized = normalizeDoc(doc);
    const resolve = (ref: NodeRef): EditorPosition => {
        const path = pathOf(normalized, ref.node);
        if (path) return clampPosition(normalized, { path, offset: ref.offset });
        return clampPosition(normalized, state.selection.head);
    };
    return { doc: normalized, selection: { anchor: resolve(anchor), head: resolve(head) }, storedMarks };
}

/** The text block objects a selection's ends sit in. */
export function selectionRefs(state: EditorState): { anchor: NodeRef; head: NodeRef } {
    const { anchor, head } = state.selection;
    return {
        anchor: { node: nodeAt(state.doc, anchor.path)!, offset: anchor.offset },
        head: { node: nodeAt(state.doc, head.path)!, offset: head.offset }
    };
}

/** Maps selection refs through a block replacement table. */
export function mapRef(ref: NodeRef, replaced: Map<EditorNode, EditorNode>): NodeRef {
    return { node: replaced.get(ref.node) ?? ref.node, offset: ref.offset };
}

/** The text blocks a range touches, each with the part of it inside the range. */
export function blocksInRange(doc: EditorNode, from: EditorPosition, to: EditorPosition): { path: number[]; node: EditorNode; from: number; to: number }[] {
    return leaves(doc)
        .filter((leaf) => leaf.kind === 'text')
        .filter((leaf) => comparePositions({ path: leaf.path, offset: 0 }, { path: to.path, offset: 0 }) <= 0 && comparePositions({ path: leaf.path, offset: Infinity }, { path: from.path, offset: 0 }) >= 0)
        .map((leaf) => ({
            path: leaf.path,
            node: leaf.node,
            from: samePath(leaf.path, from.path) ? from.offset : 0,
            to: samePath(leaf.path, to.path) ? to.offset : inlineLength(leaf.node.content)
        }));
}

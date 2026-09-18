import { deleteBetween, insertBlock, setBlockType, toggleList, toggleBlockquote, toggleTaskItem } from './commands';
import { addMarkInline, closest, hasMark, inlineText, isItem, marksAt, nodeAt, removeFromSet, replaceAt, sliceInline, withContent, type EditorMarkType } from './model';
import { sanitizeLanguage } from './sanitize';
import { finish, isCollapsed, type EditorState } from './state';

// Markdown as you type. A rule looks at the text between the start of the
// block and the caret right after a character was typed, and rewrites it.
// The editor records the typing and the rewrite as two undo steps, so an undo
// (or a Backspace straight after) gives back the characters as typed.

interface BlockContext {
    state: EditorState;
    path: number[];
    before: string;
}

function context(state: EditorState): BlockContext | null {
    if (!isCollapsed(state.selection)) return null;
    const { path, offset } = state.selection.head;
    const block = nodeAt(state.doc, path);
    if (!block || block.type !== 'paragraph') return null;
    return { state, path, before: inlineText(sliceInline(block.content, 0, offset)) };
}

/** Removes the typed prefix, then applies `fn` to the block. */
function withoutPrefix(ctx: BlockContext, fn: (state: EditorState) => EditorState | null): EditorState | null {
    const stripped = deleteBetween(ctx.state, { path: ctx.path, offset: 0 }, ctx.state.selection.head);
    return stripped ? fn(stripped) : null;
}

const inList = (ctx: BlockContext) => !!closest(ctx.state.doc, ctx.path.slice(0, -1), isItem);

function blockRule(ctx: BlockContext): EditorState | null {
    const { before } = ctx;
    let m: RegExpMatchArray | null;
    if ((m = before.match(/^(#{1,3})\s$/))) return withoutPrefix(ctx, (s) => setBlockType(s, 'heading', { level: m![1]!.length }));
    if (/^[-*+]\s$/.test(before) && !inList(ctx)) return withoutPrefix(ctx, (s) => toggleList(s, 'bulletList'));
    if ((m = before.match(/^(\d{1,9})[.)]\s$/)) && !inList(ctx)) {
        const start = Number(m[1]);
        return withoutPrefix(ctx, (s) => {
            const listed = toggleList(s, 'orderedList');
            if (!listed || start === 1) return listed;
            const list = closest(listed.doc, listed.selection.head.path, (n) => n.type === 'orderedList')!;
            return { ...listed, doc: replaceAt(listed.doc, list.path, [{ ...list.node, attrs: { start } }]) };
        });
    }
    if ((m = before.match(/^\[([ xX]?)\]\s$/)) && !inList(ctx)) {
        const checked = m[1]!.toLowerCase() === 'x';
        return withoutPrefix(ctx, (s) => {
            const listed = toggleList(s, 'taskList');
            return listed && checked ? toggleTaskItem(listed) : listed;
        });
    }
    if (/^>\s$/.test(before)) return withoutPrefix(ctx, toggleBlockquote);
    if ((m = before.match(/^```([\w+#.-]*)\s$/))) return withoutPrefix(ctx, (s) => setBlockType(s, 'codeBlock', { language: sanitizeLanguage(m![1]) }));
    if (/^(---|—-|___|\*\*\*)$/.test(before)) {
        const block = nodeAt(ctx.state.doc, ctx.path)!;
        if (inlineText(block.content) !== before) return null;
        return withoutPrefix(ctx, (s) => insertBlock(s, { type: 'horizontalRule' }));
    }
    return null;
}

const INLINE_RULES: { pattern: RegExp; mark: EditorMarkType; size: number }[] = [
    { pattern: /(?:^|[^*\\])\*\*([^*\s](?:[^*]*[^*\s])?)\*\*$/, mark: 'bold', size: 2 },
    { pattern: /(?:^|[^_\p{L}\p{N}\\])__([^_\s](?:[^_]*[^_\s])?)__$/u, mark: 'bold', size: 2 },
    { pattern: /(?:^|[^~\\])~~([^~\s](?:[^~]*[^~\s])?)~~$/, mark: 'strike', size: 2 },
    { pattern: /(?:^|[^*\\])\*([^*\s](?:[^*]*[^*\s])?)\*$/, mark: 'italic', size: 1 },
    { pattern: /(?:^|[^_\p{L}\p{N}\\])_([^_\s](?:[^_]*[^_\s])?)_$/u, mark: 'italic', size: 1 },
    { pattern: /(?:^|[^`\\])`([^`]+)`$/, mark: 'code', size: 1 }
];

function inlineRule(ctx: BlockContext): EditorState | null {
    const { state, path, before } = ctx;
    const block = nodeAt(state.doc, path)!;
    const offset = state.selection.head.offset;
    if (hasMark(marksAt(block.content, offset - 1), 'code')) return null;
    for (const rule of INLINE_RULES) {
        const m = before.match(rule.pattern);
        if (!m) continue;
        const inner = m[1]!;
        if (inner.includes('\n')) continue;
        const end = offset;
        const start = end - inner.length - rule.size * 2;
        // The closing and opening delimiters go; the text between takes the mark.
        let content = [...sliceInline(block.content, 0, start), ...sliceInline(block.content, start + rule.size, end - rule.size), ...sliceInline(block.content, end)];
        content = addMarkInline(content, start, start + inner.length, { type: rule.mark });
        const node = withContent(block, content);
        const caretAt = start + inner.length;
        const next = finish(state, replaceAt(state.doc, path, [node]), { node, offset: caretAt });
        // What is typed next is plain again.
        return { ...next, storedMarks: removeFromSet(marksAt(node.content, caretAt), rule.mark) };
    }
    return null;
}

/** The state a rule makes of the text just typed, or null when none matches. */
export function applyInputRules(state: EditorState, typed: string): EditorState | null {
    if (typed.length !== 1) return null;
    const ctx = context(state);
    if (!ctx) return null;
    if (/[\s\-*_]/.test(typed)) {
        const ruled = blockRule(ctx);
        if (ruled) return ruled;
    }
    if (/[*_~`]/.test(typed)) return inlineRule(ctx);
    return null;
}

/** Enter after ```` ```lang ```` turns the paragraph into a code block. */
export function applyEnterRule(state: EditorState): EditorState | null {
    const ctx = context(state);
    if (!ctx) return null;
    const block = nodeAt(state.doc, ctx.path)!;
    const m = inlineText(block.content).match(/^```([\w+#.-]*)$/);
    if (!m || ctx.before !== inlineText(block.content)) return null;
    const empty = withContent(block, []);
    const cleared = finish(state, replaceAt(state.doc, ctx.path, [empty]), { node: empty, offset: 0 });
    return setBlockType(cleared, 'codeBlock', { language: sanitizeLanguage(m[1]) });
}


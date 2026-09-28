import { inlineLength, inlineText, marksAfter, nodeAt, replaceAt, replaceInline, textblocks, textToInline, withContent, type EditorNode } from './model';
import { finish, selectionRefs, type EditorState, type NodeRef } from './state';

/**
 * Find and replace over a document. A match lives inside one text block —
 * the way a reader sees a paragraph — and a replacement takes the formatting
 * of the text it replaces, so changing a bold word leaves a bold word.
 */

export interface EditorFindOptions {
    caseSensitive?: boolean;
    /** Only whole words: "cat" does not find "category". */
    wholeWord?: boolean;
    /** Read the query as a regular expression; `$1` and `$&` work in the replacement. */
    regex?: boolean;
}

export interface EditorMatch {
    /** The text block it is in. */
    path: number[];
    from: number;
    to: number;
    /** What it matched, then each group a regular expression captured. */
    captures: string[];
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The pattern a query and its options make, or null when a regular expression does not parse. */
export function editorFindPattern(query: string, options: EditorFindOptions = {}): RegExp | null {
    if (!query) return null;
    let source = options.regex ? query : escape(query);
    if (options.wholeWord) source = `(?<![\\p{L}\\p{N}_])(?:${source})(?![\\p{L}\\p{N}_])`;
    try {
        return new RegExp(source, `gu${options.caseSensitive ? '' : 'i'}`);
    } catch {
        return null;
    }
}

/** Every match in the document, in reading order. */
export function findInEditor(doc: EditorNode, query: string, options: EditorFindOptions = {}): EditorMatch[] {
    const pattern = editorFindPattern(query, options);
    if (!pattern) return [];
    const out: EditorMatch[] = [];
    for (const { path, node } of textblocks(doc)) {
        const text = inlineText(node.content);
        pattern.lastIndex = 0;
        for (let m = pattern.exec(text); m; m = pattern.exec(text)) {
            // An empty match (`^`, `a*`) finds nothing to show or replace.
            if (!m[0]) {
                pattern.lastIndex++;
                continue;
            }
            out.push({ path, from: m.index, to: m.index + m[0].length, captures: [...m].map((c) => c ?? '') });
        }
    }
    return out;
}

/** The words that go in a match's place: `$&` and `$1`… read from it when the query was a regular expression. */
export function expandEditorReplacement(replacement: string, match: EditorMatch, regex = false): string {
    if (!regex) return replacement;
    return replacement.replace(/\$(\$|&|\d{1,2})/g, (whole, key: string) => {
        if (key === '$') return '$';
        if (key === '&') return match.captures[0] ?? '';
        const index = Number(key);
        return index > 0 && index < match.captures.length ? match.captures[index]! : whole;
    });
}

/**
 * Replaces matches, found against this state's document, in one step. The
 * selection stays where it was, moved along by the text before it that
 * changed length; after replacing a single match the caret goes to its end.
 */
export function replaceEditorMatches(state: EditorState, matches: readonly EditorMatch[], replacement: string, options: EditorFindOptions = {}): EditorState | null {
    if (!matches.length) return null;
    const byBlock = new Map<string, EditorMatch[]>();
    for (const match of matches) {
        const key = match.path.join('.');
        byBlock.set(key, [...(byBlock.get(key) ?? []), match]);
    }
    let doc = state.doc;
    const replaced = new Map<EditorNode, { node: EditorNode; shift: (offset: number) => number }>();
    for (const list of byBlock.values()) {
        const original = nodeAt(doc, list[0]!.path);
        if (!original?.content) continue;
        let content = original.content;
        const edits: { from: number; to: number; length: number }[] = [];
        // Back to front, so the offsets of the ones still to do hold.
        for (const match of [...list].sort((a, b) => b.from - a.from)) {
            const text = expandEditorReplacement(replacement, match, options.regex);
            const insert = original.type === 'codeBlock' ? (text ? [{ type: 'text' as const, text }] : []) : textToInline(text, marksAfter(content, match.from));
            content = replaceInline(content, match.from, match.to, insert);
            edits.push({ from: match.from, to: match.to, length: inlineLength(insert) });
        }
        const node = withContent(original, content);
        doc = replaceAt(doc, list[0]!.path, [node]);
        // An offset of the old block in the new one: moved by every edit
        // wholly before it, and to the end of the one it was inside.
        const shift = (offset: number) => {
            let delta = 0;
            for (const edit of edits) {
                if (edit.to <= offset) delta += edit.length - (edit.to - edit.from);
                else if (edit.from < offset) return edit.from + edit.length + edits.filter((e) => e.to <= edit.from).reduce((sum, e) => sum + e.length - (e.to - e.from), 0);
            }
            return offset + delta;
        };
        replaced.set(original, { node, shift });
    }
    const map = (ref: NodeRef): NodeRef => {
        const hit = replaced.get(ref.node);
        return hit ? { node: hit.node, offset: hit.shift(ref.offset) } : ref;
    };
    if (matches.length === 1) {
        const only = matches[0]!;
        const hit = replaced.get(nodeAt(state.doc, only.path)!);
        if (hit) {
            const end = { node: hit.node, offset: hit.shift(only.to) };
            return finish(state, doc, end);
        }
    }
    const refs = selectionRefs(state);
    return finish(state, doc, map(refs.anchor), map(refs.head));
}

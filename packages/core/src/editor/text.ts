import { groupInline } from './html';
import { clampLevel, inlineText, textblocks, type EditorMark, type EditorNode } from './model';

// ---- plain text ---------------------------------------------------------------------------

/** The document's text, a line per block (and per hard break). */
export function toEditorText(doc: EditorNode): string {
    return textblocks(doc)
        .map((b) => inlineText(b.node.content))
        .join('\n');
}

/** Characters of text, counted as a reader would (an emoji is one); block boundaries are not counted. */
export function countCharacters(doc: EditorNode): number {
    let n = 0;
    for (const b of textblocks(doc)) for (const node of b.node.content ?? []) if (node.type === 'text') n += [...node.text!].length;
    return n;
}

export function countWords(doc: EditorNode): number {
    return toEditorText(doc).match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu)?.length ?? 0;
}

// ---- Markdown ------------------------------------------------------------------------------

const escapeMarkdown = (text: string) => text.replace(/([\\`*_[\]<>~|])/g, '\\$1');
const escapeUrl = (url: string) => url.replace(/[()\s]/g, (c) => ({ '(': '%28', ')': '%29' })[c] ?? '%20');

function markDelimiters(mark: EditorMark): [string, string] {
    switch (mark.type) {
        case 'bold':
            return ['**', '**'];
        case 'italic':
            return ['_', '_'];
        case 'strike':
            return ['~~', '~~'];
        case 'underline':
            return ['<u>', '</u>'];
        case 'link':
            return ['[', `](${escapeUrl(mark.attrs?.href ?? '')})`];
        default:
            // Colours have no Markdown; the text stays.
            return ['', ''];
    }
}

function inlineMarkdown(content: readonly EditorNode[] | undefined): string {
    return groupInline(
        content ?? [],
        (node) => {
            if (node.type === 'hardBreak') return '\\\n';
            if (node.marks?.some((m) => m.type === 'code')) {
                const text = node.text ?? '';
                const fence = text.includes('`') ? '``' : '`';
                return `${fence}${fence.length > 1 ? ' ' : ''}${text}${fence.length > 1 ? ' ' : ''}${fence}`;
            }
            return escapeMarkdown(node.text ?? '');
        },
        (mark, inner) => {
            const [open, close] = markDelimiters(mark);
            const body = inner.join('');
            if (!open) return body;
            // Delimiters hug the text: spaces at the edges move outside them.
            const lead = mark.type === 'link' ? '' : (body.match(/^\s+/)?.[0] ?? '');
            const trail = mark.type === 'link' ? '' : (body.match(/\s+$/)?.[0] ?? '');
            const core = body.slice(lead.length, body.length - trail.length);
            return core ? `${lead}${open}${core}${close}${trail}` : body;
        }
    ).join('');
}

const indent = (text: string, prefix: string, first = prefix) =>
    text
        .split('\n')
        .map((line, i) => (i === 0 ? first : line ? prefix : prefix.trimEnd()) + line)
        .join('\n');

function blocksMarkdown(nodes: readonly EditorNode[], tight = false): string {
    return nodes.map(blockMarkdown).join(tight ? '\n' : '\n\n');
}

function blockMarkdown(node: EditorNode): string {
    switch (node.type) {
        case 'paragraph': {
            const text = inlineMarkdown(node.content);
            // A paragraph that would read as other syntax is escaped at its start.
            return text.replace(/^(#{1,6}\s|[-+]\s|\d+[.)]\s|>|```|---)/, '\\$1');
        }
        case 'heading':
            return `${'#'.repeat(clampLevel(node.attrs?.level))} ${inlineMarkdown(node.content)}`;
        case 'codeBlock': {
            const text = inlineText(node.content);
            const fence = text.includes('```') ? '~~~~' : '```';
            return `${fence}${node.attrs?.language ?? ''}\n${text}\n${fence}`;
        }
        case 'blockquote':
            return indent(blocksMarkdown(node.content ?? []), '> ');
        case 'bulletList':
        case 'taskList':
        case 'orderedList': {
            const start = node.attrs?.start ?? 1;
            return (node.content ?? [])
                .map((item, i) => {
                    let marker = node.type === 'orderedList' ? `${start + i}. ` : '- ';
                    if (item.type === 'taskItem') marker += item.attrs?.checked ? '[x] ' : '[ ] ';
                    return indent(blocksMarkdown(item.content ?? [], true), ' '.repeat(node.type === 'orderedList' ? marker.length : 2), marker);
                })
                .join('\n');
        }
        case 'horizontalRule':
            return '---';
        case 'image':
            return `![${escapeMarkdown(node.attrs?.alt ?? '')}](${escapeUrl(node.attrs?.src ?? '')}${node.attrs?.title ? ` "${node.attrs.title.replace(/"/g, '\\"')}"` : ''})`;
        case 'table': {
            const rows = (node.content ?? []).map((row) =>
                (row.content ?? []).map((cell) =>
                    (cell.content ?? [])
                        .map((b) => (b.type === 'paragraph' || b.type === 'heading' ? inlineMarkdown(b.content) : blockMarkdown(b)))
                        .join(' ')
                        .replace(/\n/g, ' ')
                )
            );
            if (!rows.length) return '';
            const width = rows[0]!.length;
            const line = (cells: string[]) => `| ${cells.join(' | ')} |`;
            return [line(rows[0]!), line(Array.from({ length: width }, () => '---')), ...rows.slice(1).map(line)].join('\n');
        }
        default:
            return '';
    }
}

/** The document as GitHub-flavoured Markdown. Underline is written as `<u>`; colours are dropped. */
export function toEditorMarkdown(doc: EditorNode): string {
    return blocksMarkdown(doc.content ?? []);
}

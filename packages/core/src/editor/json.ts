import { clampLevel, emptyParagraph, makeTextblock, normalizeDoc, type EditorMark, type EditorMarkType, type EditorNode, type EditorNodeType } from './model';
import { editorPalette, sanitizeLanguage, sanitizeUrl, type EditorColor } from './sanitize';

const SIMPLE_MARKS = new Set(['bold', 'italic', 'underline', 'strike', 'code']);
const CONTAINERS = new Set(['doc', 'blockquote', 'listItem', 'taskItem', 'tableCell', 'tableHeader', 'bulletList', 'orderedList', 'taskList', 'table', 'tableRow']);

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

function readMarks(value: unknown, palette: readonly EditorColor[]): EditorMark[] {
    if (!Array.isArray(value)) return [];
    const out: EditorMark[] = [];
    for (const raw of value) {
        if (!isObject(raw) || typeof raw.type !== 'string') continue;
        const attrs = isObject(raw.attrs) ? raw.attrs : {};
        if (SIMPLE_MARKS.has(raw.type)) out.push({ type: raw.type as EditorMarkType });
        else if (raw.type === 'link') {
            const href = sanitizeUrl(attrs.href, 'link');
            if (href) out.push({ type: 'link', attrs: { href, target: attrs.target === '_blank' ? '_blank' : null } });
        } else if (raw.type === 'color' || raw.type === 'highlight') {
            if (typeof attrs.color === 'string' && palette.some((c) => c.name === attrs.color)) out.push({ type: raw.type, attrs: { color: attrs.color } });
        }
    }
    return out;
}

function readInline(value: unknown, palette: readonly EditorColor[]): EditorNode[] {
    if (!Array.isArray(value)) return [];
    const out: EditorNode[] = [];
    for (const raw of value) {
        if (!isObject(raw)) continue;
        if (raw.type === 'text' && typeof raw.text === 'string') out.push({ type: 'text', text: raw.text, marks: readMarks(raw.marks, palette) });
        else if (raw.type === 'hardBreak') out.push({ type: 'hardBreak' });
    }
    return out;
}

function readNode(raw: unknown, palette: readonly EditorColor[], depth: number): EditorNode | null {
    if (!isObject(raw) || typeof raw.type !== 'string' || depth > 100) return null;
    const attrs = isObject(raw.attrs) ? raw.attrs : {};
    const type = raw.type as EditorNodeType;
    switch (type) {
        case 'paragraph':
            return makeTextblock('paragraph', undefined, readInline(raw.content, palette));
        case 'heading':
            return makeTextblock('heading', { level: clampLevel(attrs.level) }, readInline(raw.content, palette));
        case 'codeBlock':
            return makeTextblock('codeBlock', { language: sanitizeLanguage(attrs.language) }, readInline(raw.content, palette));
        case 'horizontalRule':
            return { type };
        case 'image': {
            const src = sanitizeUrl(attrs.src, 'image');
            return src ? { type, attrs: { src, alt: typeof attrs.alt === 'string' ? attrs.alt : '', title: typeof attrs.title === 'string' && attrs.title ? attrs.title : null } } : null;
        }
        default: {
            if (!CONTAINERS.has(type)) return null;
            const content = (Array.isArray(raw.content) ? raw.content : []).map((c) => readNode(c, palette, depth + 1)).filter((c): c is EditorNode => !!c);
            if (type === 'orderedList') {
                const start = Number(attrs.start);
                return { type, attrs: { start: Number.isInteger(start) && start >= 0 ? start : 1 }, content };
            }
            if (type === 'taskItem') return { type, attrs: { checked: attrs.checked === true }, content };
            if ((type === 'tableCell' || type === 'tableHeader') && !content.length) return { type, content: [emptyParagraph()] };
            return { type, content };
        }
    }
}

/**
 * Reads a document from JSON (the `v-model:json` format), checking it as it
 * goes, so JSON from storage or a request is as safe as sanitised HTML:
 * unknown nodes and marks are dropped, URLs and colours are checked, and the
 * tree is made well formed.
 */
export function editorDocFromJSON(value: unknown, options: { palette?: readonly EditorColor[] } = {}): EditorNode {
    const palette = options.palette ?? editorPalette;
    const node = readNode(isObject(value) && value.type === 'doc' ? value : { type: 'doc', content: [] }, palette, 0);
    return normalizeDoc(node ?? { type: 'doc', content: [] });
}

/** A deep copy of the document as plain JSON. */
export function editorDocToJSON(doc: EditorNode): EditorNode {
    return JSON.parse(JSON.stringify(doc)) as EditorNode;
}

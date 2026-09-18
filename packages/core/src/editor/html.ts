import {
    addToSet,
    clampLevel,
    emptyParagraph,
    findMark,
    makeTextblock,
    MARK_ORDER,
    normalizeDoc,
    removeFromSet,
    sameMark,
    textToInline,
    type EditorMark,
    type EditorMarkType,
    type EditorNode,
    type EditorNodeType
} from './model';
import { editorColorStyle, editorPalette, matchPaletteColor, sanitizeLanguage, sanitizeUrl, type EditorColor } from './sanitize';

// ---- inline grouping ------------------------------------------------------------------

/**
 * Walks inline content as a tree of marks: a run of nodes sharing a link (then
 * a colour, then bold…) is wrapped once, so `**a _b_**` comes out as one
 * strong element around an emphasis rather than a strong per text node.
 */
export function groupInline<T>(nodes: readonly EditorNode[], leaf: (node: EditorNode) => T, wrap: (mark: EditorMark, inner: T[]) => T): T[] {
    const go = (list: readonly EditorNode[], level: number): T[] => {
        if (level >= MARK_ORDER.length) return list.map(leaf);
        const type = MARK_ORDER[level]!;
        const out: T[] = [];
        let group: EditorNode[] = [];
        let current: EditorMark | undefined;
        const flush = () => {
            if (!group.length) return;
            if (current) out.push(wrap(current, go(group, level + 1)));
            else out.push(...go(group, level + 1));
            group = [];
        };
        list.forEach((node, i) => {
            let mark = findMark(node.marks, type);
            // A line break inside a marked run stays in it.
            if (node.type === 'hardBreak' && current) {
                const next = list.slice(i + 1).find((x) => x.type !== 'hardBreak');
                const nextMark = next && findMark(next.marks, type);
                if (nextMark && sameMark(nextMark, current)) mark = current;
            }
            const same = mark && current ? sameMark(mark, current) : !mark && !current;
            if (!same) {
                flush();
                current = mark;
            }
            group.push(node);
        });
        flush();
        return out;
    };
    return go(nodes, 0);
}

// ---- serialising ------------------------------------------------------------------------

const escapeText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u00a0/g, '&nbsp;');
const escapeAttr = (s: string) => escapeText(s).replace(/"/g, '&quot;');

/** Spaces a browser would collapse become no-break spaces, so they survive a round trip. */
function keepSpaces(content: readonly EditorNode[]): EditorNode[] {
    return content.map((node, i) => {
        if (node.type !== 'text') return node;
        let text = node.text!.replace(/ {2}/g, ' \u00a0');
        if (i === 0 || content[i - 1]!.type === 'hardBreak') text = text.replace(/^ /, '\u00a0');
        if (i === content.length - 1 || content[i + 1]!.type === 'hardBreak') text = text.replace(/ $/, '\u00a0');
        return { ...node, text };
    });
}

export interface EditorHTMLOptions {
    palette?: readonly EditorColor[];
}

function markOpen(mark: EditorMark, palette: readonly EditorColor[]): [string, string] {
    switch (mark.type) {
        case 'bold':
            return ['<strong>', '</strong>'];
        case 'italic':
            return ['<em>', '</em>'];
        case 'underline':
            return ['<u>', '</u>'];
        case 'strike':
            return ['<s>', '</s>'];
        case 'code':
            return ['<code>', '</code>'];
        case 'link': {
            const target = mark.attrs?.target === '_blank' ? ' target="_blank"' : '';
            return [`<a href="${escapeAttr(mark.attrs?.href ?? '')}"${target} rel="noopener noreferrer nofollow">`, '</a>'];
        }
        case 'color':
        case 'highlight': {
            const name = mark.attrs?.color ?? '';
            const style = editorColorStyle(name, mark.type, palette);
            const tag = mark.type === 'color' ? 'span' : 'mark';
            return [`<${tag} data-color="${escapeAttr(name)}"${style ? ` style="${escapeAttr(style)}"` : ''}>`, `</${tag}>`];
        }
    }
}

export function inlineToHTML(content: readonly EditorNode[] | undefined, options: EditorHTMLOptions = {}): string {
    const palette = options.palette ?? editorPalette;
    return groupInline(
        keepSpaces(content ?? []),
        (node) => (node.type === 'hardBreak' ? '<br>' : escapeText(node.text ?? '')),
        (mark, inner) => {
            const [open, close] = markOpen(mark, palette);
            return open + inner.join('') + close;
        }
    ).join('');
}

function blockToHTML(node: EditorNode, options: EditorHTMLOptions): string {
    const children = () => (node.content ?? []).map((child) => blockToHTML(child, options)).join('');
    switch (node.type) {
        case 'paragraph':
            return `<p>${inlineToHTML(node.content, options)}</p>`;
        case 'heading': {
            const level = clampLevel(node.attrs?.level);
            return `<h${level}>${inlineToHTML(node.content, options)}</h${level}>`;
        }
        case 'codeBlock': {
            const language = sanitizeLanguage(node.attrs?.language);
            const text = (node.content ?? []).map((n) => n.text ?? '').join('');
            return `<pre><code${language ? ` class="language-${escapeAttr(language)}"` : ''}>${escapeText(text)}</code></pre>`;
        }
        case 'blockquote':
            return `<blockquote>${children()}</blockquote>`;
        case 'bulletList':
            return `<ul>${children()}</ul>`;
        case 'orderedList': {
            const start = node.attrs?.start ?? 1;
            return `<ol${start !== 1 ? ` start="${Number(start)}"` : ''}>${children()}</ol>`;
        }
        case 'taskList':
            return `<ul data-type="taskList">${children()}</ul>`;
        case 'listItem':
            return `<li>${children()}</li>`;
        case 'taskItem': {
            const checked = !!node.attrs?.checked;
            return `<li data-type="taskItem" data-checked="${checked}"><label><input type="checkbox" disabled${checked ? ' checked' : ''}></label><div>${children()}</div></li>`;
        }
        case 'horizontalRule':
            return '<hr>';
        case 'image': {
            const src = sanitizeUrl(node.attrs?.src, 'image');
            if (!src) return '';
            const title = node.attrs?.title ? ` title="${escapeAttr(node.attrs.title)}"` : '';
            return `<img src="${escapeAttr(src)}" alt="${escapeAttr(node.attrs?.alt ?? '')}"${title}>`;
        }
        case 'table':
            return `<table><tbody>${children()}</tbody></table>`;
        case 'tableRow':
            return `<tr>${children()}</tr>`;
        case 'tableCell':
            return `<td>${children()}</td>`;
        case 'tableHeader':
            return `<th>${children()}</th>`;
        default:
            return '';
    }
}

/** True for a document that holds nothing but one empty paragraph. */
export function isEmptyDoc(doc: EditorNode): boolean {
    const content = doc.content ?? [];
    return content.length === 0 || (content.length === 1 && content[0]!.type === 'paragraph' && !content[0]!.content?.length);
}

/** The document as HTML — the editor's `v-model`. An empty document is an empty string. */
export function toEditorHTML(doc: EditorNode, options: EditorHTMLOptions = {}): string {
    if (isEmptyDoc(doc)) return '';
    return (doc.content ?? []).map((node) => blockToHTML(node, options)).join('');
}

// ---- parsing (and sanitising) ----------------------------------------------------------

export interface EditorParseOptions {
    palette?: readonly EditorColor[];
    /** The parser to use where there is no global `DOMParser` (a server). */
    domParser?: { parseFromString(source: string, type: 'text/html'): Document };
}

/** Elements dropped with everything inside them. */
const DROP = new Set([
    'script',
    'style',
    'template',
    'iframe',
    'frame',
    'frameset',
    'object',
    'embed',
    'applet',
    'noscript',
    'head',
    'title',
    'meta',
    'link',
    'base',
    'svg',
    'math',
    'canvas',
    'video',
    'audio',
    'source',
    'track',
    'map',
    'area',
    'button',
    'select',
    'option',
    'optgroup',
    'datalist',
    'textarea',
    'input',
    'xml',
    'dialog',
    'slot',
    'param',
    'colgroup',
    'col',
    'caption',
    'rp'
]);

/** Elements that end the text before them and start a new block, without being a block type of their own. */
const TRANSPARENT_BLOCKS = new Set([
    'div',
    'section',
    'article',
    'header',
    'footer',
    'main',
    'aside',
    'nav',
    'figure',
    'figcaption',
    'address',
    'center',
    'dl',
    'dt',
    'dd',
    'details',
    'summary',
    'form',
    'fieldset',
    'legend',
    'hgroup',
    'body',
    'html',
    'picture'
]);

const HEADINGS: Record<string, number> = { h1: 1, h2: 2, h3: 3, h4: 3, h5: 3, h6: 3 };

class Builder {
    blocks: EditorNode[] = [];
    private inline: EditorNode[] = [];

    constructor(
        private type: EditorNodeType = 'paragraph',
        private level?: number
    ) {}

    text(text: string, marks: EditorMark[]) {
        this.inline.push(marks.length ? { type: 'text', text, marks } : { type: 'text', text });
    }

    br() {
        this.inline.push({ type: 'hardBreak' });
    }

    /** Ends the pending text as a block; `force` keeps an empty one (an explicit empty `<p>`). */
    flush(force = false) {
        const content = cleanInline(this.inline);
        this.inline = [];
        if (!content.length && !force) return;
        this.blocks.push(makeTextblock(this.type, this.type === 'heading' ? { level: this.level } : undefined, content));
    }

    block(node: EditorNode) {
        this.flush();
        this.blocks.push(node);
    }
}

/** Collapses the white space HTML would, trims the ends, and reads no-break spaces as spaces. */
function cleanInline(nodes: EditorNode[]): EditorNode[] {
    const out: EditorNode[] = [];
    let atLineStart = true;
    for (const node of nodes) {
        if (node.type === 'hardBreak') {
            const prev = out[out.length - 1];
            if (prev?.type === 'text') prev.text = prev.text!.replace(/ +$/, '');
            out.push(node);
            atLineStart = true;
            continue;
        }
        let text = node.text!;
        if (atLineStart) text = text.replace(/^ +/, '');
        if (!text) continue;
        atLineStart = text.endsWith(' ');
        out.push({ ...node, text });
    }
    const last = out[out.length - 1];
    if (last?.type === 'text') last.text = last.text!.replace(/ +$/, '');
    const texts = out.filter((n) => n.type === 'text');
    if (!out.some((n) => n.type === 'hardBreak') && texts.every((n) => !n.text!.replace(/\u00a0/g, '').trim())) return [];
    return out.map((n) => (n.type === 'text' ? { ...n, text: n.text!.replace(/\u00a0/g, ' ') } : n)).filter((n) => n.type !== 'text' || n.text);
}

function parseStyle(el: Element): Record<string, string> {
    const out: Record<string, string> = {};
    for (const part of (el.getAttribute('style') ?? '').split(';')) {
        const colon = part.indexOf(':');
        if (colon < 0) continue;
        out[part.slice(0, colon).trim().toLowerCase()] = part
            .slice(colon + 1)
            .replace(/!important/i, '')
            .trim();
    }
    return out;
}

interface WalkContext {
    palette: readonly EditorColor[];
    depth: number;
}

function withMark(marks: EditorMark[], mark: EditorMark): EditorMark[] {
    return addToSet(marks, mark);
}

function marksFor(el: Element, tag: string, marks: EditorMark[], ctx: WalkContext): EditorMark[] {
    let out = marks;
    const style = parseStyle(el);
    const add = (type: EditorMarkType) => (out = withMark(out, { type }));
    const remove = (type: EditorMarkType) => (out = removeFromSet(out, type));
    switch (tag) {
        case 'b':
        case 'strong':
            add('bold');
            break;
        case 'i':
        case 'em':
        case 'cite':
        case 'dfn':
        case 'var':
            add('italic');
            break;
        case 'u':
        case 'ins':
            add('underline');
            break;
        case 's':
        case 'strike':
        case 'del':
            add('strike');
            break;
        case 'code':
        case 'kbd':
        case 'samp':
        case 'tt':
            add('code');
            break;
        case 'a': {
            const href = sanitizeUrl(el.getAttribute('href'), 'link');
            if (href) out = withMark(out, { type: 'link', attrs: { href, target: el.getAttribute('target') === '_blank' ? '_blank' : null } });
            break;
        }
        case 'mark': {
            const name = colorName(el, style['background-color'] ?? style.background, 'highlight', ctx) ?? 'yellow';
            if (ctx.palette.some((c) => c.name === name)) out = withMark(out, { type: 'highlight', attrs: { color: name } });
            break;
        }
        case 'font': {
            const name = colorName(el, el.getAttribute('color') ?? undefined, 'color', ctx);
            if (name) out = withMark(out, { type: 'color', attrs: { color: name } });
            break;
        }
    }
    const weight = style['font-weight'];
    if (weight) {
        if (/^(bold|bolder|[6-9]00)$/.test(weight)) add('bold');
        else if (/^(normal|lighter|[1-4]00)$/.test(weight)) remove('bold');
    }
    const fontStyle = style['font-style'];
    if (fontStyle) {
        if (/^(italic|oblique)/.test(fontStyle)) add('italic');
        else if (fontStyle === 'normal') remove('italic');
    }
    const decoration = `${style['text-decoration'] ?? ''} ${style['text-decoration-line'] ?? ''}`;
    if (/underline/.test(decoration)) add('underline');
    if (/line-through/.test(decoration)) add('strike');
    if (tag !== 'mark' && tag !== 'font') {
        const color = colorName(el, style.color, 'color', ctx, tag === 'span');
        if (color) out = withMark(out, { type: 'color', attrs: { color } });
        const background = style['background-color'] ?? style.background;
        const highlight = background ? matchPaletteColor(background, 'highlight', ctx.palette) : null;
        if (highlight) out = withMark(out, { type: 'highlight', attrs: { color: highlight } });
    }
    return out;
}

/** A palette colour from our own `data-color`, or one a pasted CSS colour maps onto. */
function colorName(el: Element, css: string | undefined, kind: 'color' | 'highlight', ctx: WalkContext, ownAttr = true): string | null {
    const own = ownAttr ? el.getAttribute('data-color') : null;
    if (own && ctx.palette.some((c) => c.name === own)) return own;
    return css ? matchPaletteColor(css, kind, ctx.palette) : null;
}

function isHidden(el: Element): boolean {
    const style = (el.getAttribute('style') ?? '').toLowerCase().replace(/\s+/g, '');
    return el.hasAttribute('hidden') || style.includes('display:none') || style.includes('mso-list:ignore');
}

function walk(parent: Node, marks: EditorMark[], b: Builder, ctx: WalkContext) {
    if (ctx.depth > 200) return;
    ctx.depth++;
    for (const child of Array.from(parent.childNodes)) visit(child, marks, b, ctx);
    ctx.depth--;
}

function visit(node: Node, marks: EditorMark[], b: Builder, ctx: WalkContext) {
    if (node.nodeType === 3) {
        const text = (node as Text).data.replace(/[\t\n\r\f ]+/g, ' ');
        if (text) b.text(text, marks);
        return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const tag = el.localName.toLowerCase();
    if (DROP.has(tag) || isHidden(el)) return;
    if (tag === 'br') {
        if (!el.classList.contains('Apple-interchange-newline')) b.br();
        return;
    }
    if (tag === 'p' || tag in HEADINGS) {
        b.flush();
        const sub = new Builder(tag === 'p' ? 'paragraph' : 'heading', HEADINGS[tag]);
        walk(el, marksFor(el, tag, marks, ctx), sub, ctx);
        sub.flush(true);
        b.blocks.push(...sub.blocks);
        return;
    }
    if (TRANSPARENT_BLOCKS.has(tag)) {
        b.flush();
        walk(el, marksFor(el, tag, marks, ctx), b, ctx);
        b.flush();
        return;
    }
    switch (tag) {
        case 'pre': {
            const code = Array.from(el.children).find((c) => c.localName === 'code');
            const language = languageOf(code) ?? languageOf(el);
            const text = preText(el).replace(/\n$/, '');
            b.block(makeTextblock('codeBlock', { language }, text ? [{ type: 'text', text }] : []));
            return;
        }
        case 'blockquote': {
            const sub = new Builder();
            walk(el, marks, sub, ctx);
            sub.flush();
            if (sub.blocks.length) b.block({ type: 'blockquote', content: sub.blocks });
            return;
        }
        case 'ul':
        case 'ol':
        case 'menu':
            b.block(parseList(el, marks, ctx));
            return;
        case 'li':
            b.block({ type: 'bulletList', content: [parseItem(el, marks, ctx, 'listItem')] });
            return;
        case 'table': {
            const table = parseTable(el, marks, ctx);
            if (table) b.block(table);
            return;
        }
        case 'hr':
            b.block({ type: 'horizontalRule' });
            return;
        case 'img': {
            const src = sanitizeUrl(el.getAttribute('src'), 'image');
            if (src) b.block({ type: 'image', attrs: { src, alt: el.getAttribute('alt') ?? '', title: el.getAttribute('title') || null } });
            return;
        }
        default:
            // Inline and unknown elements are transparent: their text stays, with their marks.
            walk(el, marksFor(el, tag, marks, ctx), b, ctx);
    }
}

function languageOf(el: Element | undefined): string | null {
    if (!el) return null;
    const data = el.getAttribute('data-language');
    if (data) return sanitizeLanguage(data);
    const cls = Array.from(el.classList).find((c) => /^(language|lang)-/.test(c));
    return cls ? sanitizeLanguage(cls.replace(/^(language|lang)-/, '')) : null;
}

function preText(el: Node): string {
    let out = '';
    for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === 3) out += (child as Text).data;
        else if (child.nodeType === 1) {
            const tag = (child as Element).localName;
            if (tag === 'br') out += '\n';
            else if (!DROP.has(tag)) {
                out += preText(child);
                if ((tag === 'div' || tag === 'p') && !out.endsWith('\n')) out += '\n';
            }
        }
    }
    return out;
}

function checkboxOf(li: Element): HTMLInputElement | null {
    for (const child of Array.from(li.children)) {
        const tag = child.localName;
        if (tag === 'input' && (child as HTMLInputElement).type === 'checkbox') return child as HTMLInputElement;
        if (tag === 'label' || tag === 'p' || tag === 'span') {
            const inner = Array.from(child.children).find((c) => c.localName === 'input' && (c as HTMLInputElement).type === 'checkbox');
            if (inner) return inner as HTMLInputElement;
        }
    }
    return null;
}

const isTaskItem = (li: Element) => li.getAttribute('data-type') === 'taskItem' || li.hasAttribute('data-checked') || li.classList.contains('task-list-item') || !!checkboxOf(li);

function parseItem(li: Element, marks: EditorMark[], ctx: WalkContext, type: EditorNodeType): EditorNode {
    const sub = new Builder();
    walk(li, marks, sub, ctx);
    sub.flush();
    const content = sub.blocks.length ? sub.blocks : [emptyParagraph()];
    if (type !== 'taskItem') return { type, content };
    const box = checkboxOf(li);
    const checked = li.getAttribute('data-checked') === 'true' || !!box?.hasAttribute('checked') || !!box?.checked;
    return { type, attrs: { checked }, content };
}

function parseList(el: Element, marks: EditorMark[], ctx: WalkContext): EditorNode {
    const lis = Array.from(el.children).filter((c) => c.localName === 'li');
    const task = el.getAttribute('data-type') === 'taskList' || (lis.length > 0 && lis.every(isTaskItem));
    const type: EditorNodeType = task ? 'taskList' : el.localName === 'ol' ? 'orderedList' : 'bulletList';
    const itemType: EditorNodeType = task ? 'taskItem' : 'listItem';
    const items: EditorNode[] = [];
    for (const child of Array.from(el.childNodes)) {
        if (child.nodeType === 1) {
            const c = child as Element;
            if (c.localName === 'li') {
                items.push(parseItem(c, marks, ctx, itemType));
                continue;
            }
            if (DROP.has(c.localName)) continue;
        } else if (child.nodeType !== 3 || !(child as Text).data.trim()) continue;
        // Anything else in a list (a sub-list written without its <li>, stray text) joins the item before it.
        const sub = new Builder();
        visit(child, marks, sub, ctx);
        sub.flush();
        if (!sub.blocks.length) continue;
        const previous = items[items.length - 1];
        if (previous) items[items.length - 1] = { ...previous, content: [...previous.content!, ...sub.blocks] };
        else items.push(task ? { type: itemType, attrs: { checked: false }, content: sub.blocks } : { type: itemType, content: sub.blocks });
    }
    const start = Number.parseInt(el.getAttribute('start') ?? '', 10);
    return type === 'orderedList' ? { type, attrs: { start: Number.isFinite(start) && start >= 0 ? start : 1 }, content: items } : { type, content: items };
}

function parseTable(el: Element, marks: EditorMark[], ctx: WalkContext): EditorNode | null {
    const rows: Element[] = [];
    for (const child of Array.from(el.children)) {
        if (child.localName === 'tr') rows.push(child);
        else if (/^(thead|tbody|tfoot)$/.test(child.localName)) rows.push(...Array.from(child.children).filter((r) => r.localName === 'tr'));
    }
    const content = rows
        .map((row): EditorNode => ({
            type: 'tableRow',
            content: Array.from(row.children)
                .filter((c) => c.localName === 'td' || c.localName === 'th')
                .flatMap((c) => {
                    const sub = new Builder();
                    walk(c, marks, sub, ctx);
                    sub.flush();
                    const cell: EditorNode = { type: c.localName === 'th' ? 'tableHeader' : 'tableCell', content: sub.blocks.length ? sub.blocks : [emptyParagraph()] };
                    const span = Math.min(20, Math.max(1, Number.parseInt(c.getAttribute('colspan') ?? '1', 10) || 1));
                    return [cell, ...Array.from({ length: span - 1 }, () => ({ type: cell.type, content: [emptyParagraph()] }))];
                })
        }))
        .filter((r) => r.content!.length);
    return content.length ? { type: 'table', content } : null;
}

/**
 * Word writes a list as paragraphs with `mso-list: l0 level2` in their style
 * and the bullet as hidden text; this rebuilds real nested lists from them.
 */
function rebuildWordLists(root: Element) {
    const doc = root.ownerDocument;
    const isListParagraph = (n: Node | null): n is Element => !!n && n.nodeType === 1 && (n as Element).localName === 'p' && /mso-list\s*:\s*l\d+/i.test((n as Element).getAttribute('style') ?? '');
    const paragraphs = Array.from(root.querySelectorAll('p')).filter(isListParagraph);
    const done = new Set<Element>();
    for (const first of paragraphs) {
        if (done.has(first)) continue;
        const group: Element[] = [];
        let node: Node | null = first;
        const listId = (p: Element) => (p.getAttribute('style') ?? '').match(/mso-list\s*:\s*(l\d+)/i)?.[1];
        while (node) {
            if (isListParagraph(node)) {
                // Another Word list starts a list of its own.
                if (listId(node) !== listId(first)) break;
                group.push(node);
                done.add(node);
            } else if (!(node.nodeType === 3 && !(node as Text).data.trim()) && node.nodeType !== 8) break;
            node = node.nextSibling;
        }
        const stack: { level: number; list: Element }[] = [];
        const fragment = doc.createDocumentFragment();
        for (const p of group) {
            const style = p.getAttribute('style') ?? '';
            const level = Number(style.match(/level(\d+)/i)?.[1] ?? 1);
            const marker = Array.from(p.querySelectorAll('span')).find((s) => /mso-list\s*:\s*ignore/i.test(s.getAttribute('style') ?? ''))?.textContent?.trim() ?? '';
            const ordered = /^[(]?([0-9]{1,3}|[a-z]|[ivxlc]{1,6})[.)]$/i.test(marker);
            while (stack.length && stack[stack.length - 1]!.level > level) stack.pop();
            let top = stack[stack.length - 1];
            if (!top || top.level < level) {
                const list = doc.createElement(ordered ? 'ol' : 'ul');
                if (top) (top.list.lastElementChild ?? top.list).appendChild(list);
                else fragment.appendChild(list);
                top = { level, list };
                stack.push(top);
            }
            const li = doc.createElement('li');
            while (p.firstChild) li.appendChild(p.firstChild);
            top.list.appendChild(li);
        }
        group[0]!.parentNode?.insertBefore(fragment, group[0]!);
        for (const p of group) p.remove();
    }
}

/** Plain text as paragraphs, one per line; blank lines are dropped. */
export function textToEditorDoc(text: string): EditorNode {
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const content = lines.filter((line) => line.trim()).map((line) => makeTextblock('paragraph', undefined, textToInline(line.replace(/\t/g, '    '))));
    return normalizeDoc({ type: 'doc', content });
}

function parser(options: EditorParseOptions) {
    if (options.domParser) return options.domParser;
    if (typeof DOMParser !== 'undefined') return new DOMParser();
    return null;
}

/**
 * Reads HTML into a document — and in doing so sanitises it, because only
 * what the schema knows is read: the listed elements, safe URLs, palette
 * colours. Scripts, event handlers, styles, unknown attributes and
 * `javascript:` links cannot survive, since nothing copies them. Word and
 * Google Docs markup is understood well enough to keep its structure and
 * marks and lose its noise.
 */
export function parseEditorHTML(html: string, options: EditorParseOptions = {}): EditorNode {
    const p = parser(options);
    // Without a DOM, the text is all that can be trusted.
    if (!p) return textToEditorDoc(html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
    // DOMParser documents are inert: no script runs and no image loads.
    const dom = p.parseFromString(html, 'text/html');
    const body = dom.body;
    if (!body) return normalizeDoc({ type: 'doc', content: [] });
    rebuildWordLists(body);
    const builder = new Builder();
    walk(body, [], builder, { palette: options.palette ?? editorPalette, depth: 0 });
    builder.flush();
    return normalizeDoc({ type: 'doc', content: builder.blocks });
}

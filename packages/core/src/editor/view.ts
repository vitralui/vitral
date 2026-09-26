import type { EditorInstance } from './editor';
import { groupInline, isEmptyDoc, parseEditorHTML, textToEditorDoc } from './html';
import { editorKeymap, isMacPlatform, keyName, type EditorKeyBinding } from './keymap';
import { clampLevel, inlineLength, inlineText, isAtom, isTextblock, makeTextblock, marksAt, replaceAt, replaceInline, textToInline, type EditorMark, type EditorNode, type EditorPosition } from './model';
import { editorColorStyle, sanitizeUrl } from './sanitize';
import { caret, isCollapsed, selectionRange, type EditorSelection } from './state';
import { deleteBetween, deleteForward, fragmentText, insertContent, insertText, linkAt } from './commands';
import { createTooltip, type TooltipHandle, type TooltipOptions } from '../overlay/tooltip';
import { formatMessage } from '../locale/locale';

// The bridge between an editor and a `contenteditable` element. The element
// shows the document and reports what the user does; it is never the source
// of truth. Typing, deleting, Enter and formatting arrive as `beforeinput`
// and become commands, with the browser's own change cancelled; the document
// is then drawn again (only the blocks that changed) and the selection put
// back. What cannot be cancelled (an IME composition, some mobile input) is
// let through and read back from the DOM once it is over.

export interface EditorViewOptions {
    /** Whether the content can be changed. Read on every event. */
    editable?: () => boolean;
    keymap?: Readonly<Record<string, EditorKeyBinding>>;
    /**
     * A key the interface may want first: `link` and `toolbar` bindings,
     * Escape. Return true when it was handled, and the view does nothing more.
     */
    handleKey?: (name: string, binding: EditorKeyBinding | undefined, event: KeyboardEvent) => boolean;
    /** The accessible name of a task item's checkbox. */
    taskLabel?: string;
    /** Class on a selected image or rule. */
    selectedClass?: string;
    /** Class on the element while the document is empty (it shows the placeholder). */
    emptyClass?: string;
    /**
     * The tooltip over a link while the text can be changed, saying how to
     * follow it (a click there only places the caret). Given the address,
     * return its options — the words, the classes — or nothing for none.
     */
    linkHint?: (href: string) => TooltipOptions | null | undefined;
}

/**
 * The words over a link: where it goes and how to follow it —
 * `example.com/docs — Ctrl+click to open`. A long address is cut short in
 * the middle of nowhere useful, so it is cut at the end.
 */
export function editorLinkHint(href: string, followLink: string, mac = isMacPlatform()): string {
    const shown = href.replace(/^(https?:\/\/|mailto:|tel:)/, '').replace(/\/$/, '');
    const short = shown.length > 48 ? `${shown.slice(0, 47)}…` : shown;
    return `${short} — ${formatMessage(followLink, { key: mac ? '⌘' : 'Ctrl' })}`;
}

/** Opens a link in a new tab, with no way back to the page that opened it. */
export function followEditorLink(href: string): void {
    if (typeof window === 'undefined' || !href) return;
    window.open(href, '_blank', 'noopener,noreferrer');
}

export interface EditorView {
    readonly dom: HTMLElement;
    /** Draws the document and the selection again. The view does this itself on every change. */
    update(): void;
    focus(): void;
    hasFocus(): boolean;
    /** The rectangle of the selection, for anchoring a floating toolbar. */
    selectionRect(): DOMRect | null;
    /** A position from a DOM point, when the point is in the document. */
    posFromDOM(node: Node, offset: number): EditorPosition | null;
    /** The DOM point of a position. */
    domFromPos(pos: EditorPosition): { node: Node; offset: number } | null;
    /** Reads the DOM selection into the editor. */
    readSelection(): void;
    /** Reads text the browser changed on its own (an IME, autocorrect) back into the document. */
    readDOM(): void;
    destroy(): void;
}

const FILLER = 'data-vt-filler';
const MARK_TAGS: Record<string, string> = { bold: 'strong', italic: 'em', underline: 'u', strike: 's', code: 'code', link: 'a', color: 'span', highlight: 'mark' };

function isFiller(node: Node): boolean {
    return node.nodeType === 1 && (node as Element).hasAttribute(FILLER);
}

export function createEditorView(root: HTMLElement, editor: EditorInstance, options: EditorViewOptions = {}): EditorView {
    const doc = root.ownerDocument;
    const editable = () => options.editable?.() ?? true;
    const keymap = options.keymap ?? editorKeymap;
    let cache = new WeakMap<EditorNode, HTMLElement>();
    let blockPaths = new Map<Element, number[]>();
    let atomPaths = new Map<Element, number[]>();
    let blockByKey = new Map<string, HTMLElement>();
    let nodeOf = new WeakMap<Element, EditorNode>();
    let renderedDoc: EditorNode | null = null;
    let composing = false;
    let rendering = false;
    let pointerDown = false;
    let selectedAtom: number[] | null = null;
    let destroyed = false;

    // ---- drawing ------------------------------------------------------------------------

    function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}): HTMLElementTagNameMap[K] {
        const e = doc.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
        return e;
    }

    function filler(): HTMLElement {
        const br = el('br');
        br.setAttribute(FILLER, '');
        return br;
    }

    function markElement(mark: EditorMark): HTMLElement {
        const e = doc.createElement(MARK_TAGS[mark.type] ?? 'span');
        if (mark.type === 'link') {
            const href = sanitizeUrl(mark.attrs?.href, 'link');
            if (href) e.setAttribute('href', href);
            if (mark.attrs?.target === '_blank') e.setAttribute('target', '_blank');
            e.setAttribute('rel', 'noopener noreferrer nofollow');
        } else if (mark.type === 'color' || mark.type === 'highlight') {
            const name = mark.attrs?.color ?? '';
            e.setAttribute('data-color', name);
            const style = editorColorStyle(name, mark.type, editor.palette);
            if (style) e.setAttribute('style', style);
        }
        return e;
    }

    function drawInline(host: HTMLElement, content: readonly EditorNode[]) {
        const nodes = groupInline<Node>(
            content,
            (node) => (node.type === 'hardBreak' ? el('br') : doc.createTextNode(node.text ?? '')),
            (mark, inner) => {
                const e = markElement(mark);
                e.append(...inner);
                return e;
            }
        );
        host.append(...nodes);
        const last = content[content.length - 1];
        // An empty block, or one ending in a line break, needs a filler to have a line to put the caret on.
        if (!last || last.type === 'hardBreak') host.appendChild(filler());
    }

    function textblockElement(node: EditorNode): HTMLElement {
        if (node.type === 'codeBlock') {
            const pre = el('pre');
            const code = el('code');
            const language = node.attrs?.language;
            if (language) {
                pre.setAttribute('data-language', language);
                code.className = `language-${language}`;
            }
            const text = inlineText(node.content);
            if (text) code.appendChild(doc.createTextNode(text));
            if (!text || text.endsWith('\n')) code.appendChild(filler());
            pre.appendChild(code);
            return pre;
        }
        const e = node.type === 'heading' ? el(`h${clampLevel(node.attrs?.level)}` as 'h1') : el('p');
        drawInline(e, node.content ?? []);
        return e;
    }

    function atomElement(node: EditorNode): HTMLElement {
        const wrap = el('div', { contenteditable: 'false', 'data-type': node.type });
        if (node.type === 'image') {
            const img = el('img', { alt: node.attrs?.alt ?? '', draggable: 'false' });
            const src = sanitizeUrl(node.attrs?.src, 'image');
            if (src) img.setAttribute('src', src);
            if (node.attrs?.title) img.setAttribute('title', node.attrs.title);
            wrap.appendChild(img);
        } else {
            wrap.appendChild(el('hr'));
        }
        return wrap;
    }

    /** The element a container's children go in, and the container's own element. */
    function containerShell(node: EditorNode): { outer: HTMLElement; inner: HTMLElement } {
        switch (node.type) {
            case 'blockquote': {
                const e = el('blockquote');
                return { outer: e, inner: e };
            }
            case 'bulletList': {
                const e = el('ul');
                return { outer: e, inner: e };
            }
            case 'orderedList': {
                const e = el('ol');
                if ((node.attrs?.start ?? 1) !== 1) e.setAttribute('start', String(node.attrs?.start));
                return { outer: e, inner: e };
            }
            case 'taskList': {
                const e = el('ul', { 'data-type': 'taskList' });
                return { outer: e, inner: e };
            }
            case 'taskItem': {
                const checked = !!node.attrs?.checked;
                const li = el('li', { 'data-type': 'taskItem', 'data-checked': String(checked) });
                const label = el('label', { contenteditable: 'false' });
                const box = el('input', { type: 'checkbox', tabindex: '-1' });
                box.checked = checked;
                if (checked) box.setAttribute('checked', '');
                if (options.taskLabel) box.setAttribute('aria-label', options.taskLabel);
                if (!editable()) box.disabled = true;
                label.appendChild(box);
                const body = el('div');
                li.append(label, body);
                return { outer: li, inner: body };
            }
            case 'table': {
                const table = el('table');
                const body = el('tbody');
                table.appendChild(body);
                return { outer: table, inner: body };
            }
            default: {
                const tag = ({ listItem: 'li', tableRow: 'tr', tableCell: 'td', tableHeader: 'th' } as Record<string, keyof HTMLElementTagNameMap>)[node.type] ?? 'div';
                const e = el(tag) as HTMLElement;
                return { outer: e, inner: e };
            }
        }
    }

    const inners = new WeakMap<HTMLElement, HTMLElement>();

    function draw(node: EditorNode, path: number[]): HTMLElement {
        let element = cache.get(node);
        if (isTextblock(node)) {
            if (!element) {
                element = textblockElement(node);
                cache.set(node, element);
            }
            blockPaths.set(element, path);
            blockByKey.set(path.join('.'), element);
        } else if (isAtom(node)) {
            if (!element) {
                element = atomElement(node);
                cache.set(node, element);
            }
            atomPaths.set(element, path);
        } else {
            if (!element) {
                const shell = containerShell(node);
                element = shell.outer;
                inners.set(element, shell.inner);
                cache.set(node, element);
            }
            const box = element.querySelector<HTMLInputElement>(':scope > label > input');
            if (box) box.disabled = !editable();
            // A container's children are placed every time: an undo can bring back a
            // container whose child elements have since moved to a newer one.
            syncChildren(inners.get(element)!, (node.content ?? []).map((child, i) => draw(child, [...path, i])));
        }
        nodeOf.set(element, node);
        return element;
    }

    function syncChildren(parent: HTMLElement, wanted: HTMLElement[]) {
        wanted.forEach((child, i) => {
            const current = parent.childNodes[i];
            if (current !== child) parent.insertBefore(child, current ?? null);
        });
        while (parent.childNodes.length > wanted.length) parent.removeChild(parent.lastChild!);
    }

    function render(force = false) {
        const state = editor.state;
        if (force) cache = new WeakMap();
        rendering = true;
        observer?.disconnect();
        try {
            if (force || state.doc !== renderedDoc) {
                blockPaths = new Map();
                atomPaths = new Map();
                blockByKey = new Map();
                nodeOf = new WeakMap();
                syncChildren(
                    root,
                    (state.doc.content ?? []).map((child, i) => draw(child, [i]))
                );
                renderedDoc = state.doc;
                if (selectedAtom && !atomPaths.size) selectedAtom = null;
            }
            const empty = isEmptyDoc(state.doc);
            if (options.emptyClass) root.classList.toggle(options.emptyClass, empty);
            paintAtomSelection();
        } finally {
            observer?.observe(root, { childList: true, subtree: true, characterData: true });
            rendering = false;
        }
    }

    function paintAtomSelection() {
        for (const [element, path] of atomPaths) {
            const on = !!selectedAtom && path.join('.') === selectedAtom.join('.');
            if (options.selectedClass) element.classList.toggle(options.selectedClass, on);
            if (on) element.setAttribute('data-selected', '');
            else element.removeAttribute('data-selected');
        }
    }

    // ---- positions ------------------------------------------------------------------------

    function blockOf(node: Node | null): Element | null {
        for (let n: Node | null = node; n && n !== root; n = n.parentNode) {
            if (n.nodeType === 1 && blockPaths.has(n as Element)) return n as Element;
        }
        return null;
    }

    /** Characters before a DOM point inside a text block's element. */
    function offsetIn(block: Element, target: Node, targetOffset: number): number {
        let count = 0;
        const measure = (n: Node) => {
            if (n.nodeType === 3) count += (n as Text).data.length;
            else if (n.nodeType === 1) {
                if ((n as Element).localName === 'br') {
                    if (!isFiller(n)) count += 1;
                } else n.childNodes.forEach(measure);
            }
        };
        const visit = (n: Node): boolean => {
            if (n === target) {
                if (n.nodeType === 3) count += Math.min(targetOffset, (n as Text).data.length);
                else {
                    const kids = n.childNodes;
                    for (let i = 0; i < Math.min(targetOffset, kids.length); i++) measure(kids[i]!);
                }
                return true;
            }
            if (n.nodeType === 3) {
                count += (n as Text).data.length;
                return false;
            }
            if (n.nodeType !== 1) return false;
            if ((n as Element).localName === 'br') {
                if (!isFiller(n)) count += 1;
                return false;
            }
            for (const child of Array.from(n.childNodes)) if (visit(child)) return true;
            return false;
        };
        visit(block);
        return count;
    }

    /** The first text block at or after a node (or the last one at or before it), as a position at its start (end). */
    function firstBlockFrom(node: Node, forward: boolean): EditorPosition | null {
        const blocks = [...blockPaths.entries()];
        if (!blocks.length) return null;
        const inside = (b: Element) => b === node || !!(node.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_CONTAINED_BY);
        const end = (entry: [Element, number[]]): EditorPosition => ({ path: entry[1], offset: inlineLength(nodeOf.get(entry[0])?.content) });
        if (forward) {
            const next = blocks.find(([b]) => inside(b) || node.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
            if (next) return { path: next[1], offset: 0 };
            return end(blocks[blocks.length - 1]!);
        }
        const previous = [...blocks].reverse().find(([b]) => inside(b) || node.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING);
        return previous ? end(previous) : { path: blocks[0]![1], offset: 0 };
    }

    function posFromDOM(node: Node, offset: number, clamp = true): EditorPosition | null {
        if (node !== root && !root.contains(node)) return null;
        const block = blockOf(node);
        if (block) {
            const model = nodeOf.get(block);
            const at = offsetIn(block, node, offset);
            return { path: blockPaths.get(block)!, offset: clamp && model ? Math.min(at, inlineLength(model.content)) : at };
        }
        // Between blocks, or on an image: the nearest text block, looking forward first.
        const child = node.nodeType === 1 ? (node.childNodes[offset] ?? null) : null;
        if (child) return firstBlockFrom(child, true);
        if (node.nodeType === 1 && offset >= node.childNodes.length && node.lastChild) return firstBlockFrom(node.lastChild, false) ?? firstBlockFrom(node, true);
        return firstBlockFrom(node, true);
    }

    function domFromPos(pos: EditorPosition): { node: Node; offset: number } | null {
        const block = blockByKey.get(pos.path.join('.'));
        if (!block) return null;
        let count = 0;
        let found: { node: Node; offset: number } | null = null;
        let lastLeaf: Node | null = null;
        const visit = (n: Node): boolean => {
            if (n.nodeType === 3) {
                const len = (n as Text).data.length;
                if (count + len >= pos.offset) {
                    found = { node: n, offset: pos.offset - count };
                    return true;
                }
                count += len;
                lastLeaf = n;
                return false;
            }
            if (n.nodeType !== 1) return false;
            if ((n as Element).localName === 'br') {
                const parent = n.parentNode!;
                const index = Array.prototype.indexOf.call(parent.childNodes, n);
                if (count === pos.offset) {
                    found = { node: parent, offset: index };
                    return true;
                }
                if (!isFiller(n)) count += 1;
                lastLeaf = n;
                return false;
            }
            for (const child of Array.from(n.childNodes)) if (visit(child)) return true;
            return false;
        };
        visit(block);
        if (found) return found;
        const leaf = lastLeaf as Node | null;
        if (leaf?.nodeType === 1) {
            const parent = leaf.parentNode!;
            return { node: parent, offset: Array.prototype.indexOf.call(parent.childNodes, leaf) + 1 };
        }
        const host = block.localName === 'pre' ? (block.firstElementChild ?? block) : block;
        return { node: host, offset: host.childNodes.length };
    }

    // ---- selection ----------------------------------------------------------------------

    function domSelection(): Selection | null {
        const getter = (root.getRootNode() as Document | ShadowRoot & { getSelection?: () => Selection | null }).getSelection;
        return (getter ? getter.call(root.getRootNode()) : null) ?? doc.getSelection();
    }

    function readSelection() {
        if (composing || rendering || destroyed) return;
        const sel = domSelection();
        if (!sel || !sel.anchorNode || !sel.focusNode) return;
        if (!root.contains(sel.anchorNode) || !root.contains(sel.focusNode)) return;
        const anchor = posFromDOM(sel.anchorNode, sel.anchorOffset);
        const head = posFromDOM(sel.focusNode, sel.focusOffset);
        if (!anchor || !head) return;
        editor.setSelection({ anchor, head });
    }

    function writeSelection() {
        const sel = domSelection();
        if (!sel) return;
        const { anchor, head } = editor.state.selection;
        const a = domFromPos(anchor);
        const h = domFromPos(head);
        if (!a || !h) return;
        if (sel.anchorNode === a.node && sel.anchorOffset === a.offset && sel.focusNode === h.node && sel.focusOffset === h.offset) return;
        rendering = true;
        try {
            sel.setBaseAndExtent(a.node, a.offset, h.node, h.offset);
        } catch {
            // A point the browser refuses (an element inside contenteditable=false): leave the selection.
        } finally {
            rendering = false;
        }
        const target = (h.node.nodeType === 1 ? h.node : h.node.parentElement) as Element | null;
        if (target && typeof (target as HTMLElement).scrollIntoView === 'function' && isCollapsed(editor.state.selection)) {
            const rect = target.getBoundingClientRect?.();
            const box = root.getBoundingClientRect?.();
            if (rect && box && (rect.bottom > box.bottom || rect.top < box.top) && root.scrollHeight > root.clientHeight) target.scrollIntoView({ block: 'nearest' });
        }
    }

    const hasFocus = () => doc.activeElement === root || (!!doc.activeElement && root.contains(doc.activeElement) && doc.activeElement.localName !== 'input');

    function update() {
        if (destroyed) return;
        if (composing) return;
        render();
        // The link it hung from was drawn again: the tooltip goes with it.
        if (hint && !root.contains(hint.link)) clearHint();
        if (hasFocus()) writeSelection();
    }

    // ---- reading changes the browser made ---------------------------------------------------

    let pending: MutationRecord[] = [];
    const observer: MutationObserver | null =
        typeof MutationObserver !== 'undefined'
            ? new MutationObserver((records) => {
                  if (!rendering) pending.push(...records);
              })
            : null;

    /** The text of a block element as the model counts it. */
    function domText(block: Element): string {
        let out = '';
        const walk = (n: Node) => {
            if (n.nodeType === 3) out += (n as Text).data;
            else if (n.nodeType === 1) {
                const e = n as Element;
                if (e.localName === 'br') {
                    if (!isFiller(e)) out += '\n';
                } else if (e.getAttribute('contenteditable') !== 'false') e.childNodes.forEach(walk);
            }
        };
        walk(block);
        return out.replace(/\u00a0/g, ' ');
    }

    function readDOM() {
        if (destroyed) return;
        const records = [...pending, ...(observer?.takeRecords() ?? [])];
        pending = [];
        if (!records.length) return;
        const dirty = new Set<Element>();
        let structural = false;
        for (const record of records) {
            const block = blockOf(record.target);
            if (block && block.isConnected) dirty.add(block);
            else if (record.type === 'childList') {
                const ours = [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)].every((n) => n.nodeType === 3 || isFiller(n) || (n as Element).localName === 'br');
                if (!ours || !block) structural = true;
            }
        }
        for (const block of blockPaths.keys()) if (!block.isConnected) structural = true;
        const state = editor.state;
        if (structural) {
            // The browser reshaped blocks (an unhandled Enter, a mobile keyboard): read the whole thing again.
            const parsed = parseEditorHTML(root.innerHTML, { palette: editor.palette });
            cache = new WeakMap();
            editor.apply({ doc: parsed, selection: caret([0], 0), storedMarks: null }, { origin: 'user' });
            render(true);
            readSelectionNow();
            return;
        }
        let next = state.doc;
        for (const block of dirty) {
            const model = nodeOf.get(block);
            const path = blockPaths.get(block);
            if (!model || !path) continue;
            const before = inlineText(model.content);
            const after = domText(block);
            if (before === after) continue;
            let start = 0;
            while (start < before.length && start < after.length && before[start] === after[start]) start++;
            let endBefore = before.length;
            let endAfter = after.length;
            while (endBefore > start && endAfter > start && before[endBefore - 1] === after[endAfter - 1]) {
                endBefore--;
                endAfter--;
            }
            const inserted = after.slice(start, endAfter);
            const marks = marksAt(model.content, start);
            const content =
                model.type === 'codeBlock'
                    ? [{ type: 'text' as const, text: before.slice(0, start) + inserted + before.slice(endBefore) }]
                    : replaceInline(model.content, start, endBefore, textToInline(inserted, marks));
            const replacement = makeTextblock(model.type, model.attrs, content);
            next = replaceAt(next, path, [replacement]);
            // The element the browser edited is not reused.
            cache.delete(model);
        }
        if (next === state.doc) return;
        const sel = domSelection();
        let selection: EditorSelection = state.selection;
        if (sel?.anchorNode && sel.focusNode && root.contains(sel.anchorNode)) {
            // Measured against the text the browser now shows, not the old block.
            const anchor = posFromDOM(sel.anchorNode, sel.anchorOffset, false);
            const head = posFromDOM(sel.focusNode, sel.focusOffset, false);
            if (anchor && head) selection = { anchor, head };
        }
        const applied = editor.apply({ doc: next, selection, storedMarks: null }, { origin: 'user', history: 'typing' });
        if (!applied) {
            for (const block of dirty) {
                const model = nodeOf.get(block);
                if (model) cache.delete(model);
            }
            render(true);
            if (hasFocus()) writeSelection();
        }
    }

    function readSelectionNow() {
        if (hasFocus()) writeSelection();
    }

    // ---- input -----------------------------------------------------------------------------

    function staticRange(event: InputEvent): { from: EditorPosition; to: EditorPosition } | null {
        const ranges = typeof event.getTargetRanges === 'function' ? event.getTargetRanges() : [];
        const range = ranges[0];
        if (!range) return null;
        const from = posFromDOM(range.startContainer, range.startOffset);
        const to = posFromDOM(range.endContainer, range.endOffset);
        return from && to ? { from, to } : null;
    }

    function insertTransfer(data: DataTransfer | null) {
        if (!data) return;
        const html = data.getData('text/html');
        const text = data.getData('text/plain');
        const state = editor.state;
        const { from } = selectionRange(state.selection);
        const inCode = blockByKey.get(from.path.join('.'))?.localName === 'pre';
        if (inCode || (!html && !text)) {
            if (text) editor.apply(insertText(state, text), { origin: 'user' });
            return;
        }
        let parsed = html ? parseEditorHTML(html, { palette: editor.palette }) : textToEditorDoc(text);
        if (html && isEmptyDoc(parsed) && text) parsed = textToEditorDoc(text);
        if (editor.apply(insertContent(state, parsed.content ?? []), { origin: 'user' })) return;
        // Too long for the limit: as much of the text as fits.
        if (editor.maxLength != null) {
            const plain = fragmentText(parsed.content ?? []).replace(/\n/g, ' ');
            const selected = selectionRange(state.selection);
            const selectedLength = selected.empty ? 0 : [...editor.getText()].length; // upper bound
            const room = Math.max(0, editor.maxLength - editor.characterCount() + Math.min(selectedLength, editor.characterCount()));
            for (let size = Math.min(room, [...plain].length); size > 0; size--) {
                if (editor.apply(insertText(state, [...plain].slice(0, size).join('')), { origin: 'user' })) return;
                if (size > 64) size = Math.floor(size * 0.75);
            }
        }
    }

    function onBeforeInput(event: InputEvent) {
        if (!editable()) {
            event.preventDefault();
            return;
        }
        if (composing || event.isComposing) return;
        if (!event.cancelable) return;
        readSelection();
        const type = event.inputType;
        event.preventDefault();
        const unit = /Word/.test(type) ? 'word' : /Line/.test(type) ? 'line' : 'char';
        switch (type) {
            case 'insertText':
            case 'insertReplacementText': {
                const text = event.data ?? event.dataTransfer?.getData('text/plain') ?? '';
                const range = staticRange(event);
                if (range && (range.from.offset !== range.to.offset || range.from.path.join() !== range.to.path.join())) editor.setSelection({ anchor: range.from, head: range.to });
                if (text) editor.typeText(text);
                break;
            }
            case 'insertParagraph':
                editor.enter();
                break;
            case 'insertLineBreak':
                editor.run('insertHardBreak');
                break;
            case 'deleteContentBackward':
            case 'deleteWordBackward':
            case 'deleteSoftLineBackward':
            case 'deleteHardLineBackward':
                if (selectedAtom) deleteSelectedAtom();
                else {
                    const range = staticRange(event);
                    const sel = editor.state.selection;
                    const sameBlock = range && range.from.path.join() === range.to.path.join() && range.from.path.join() === sel.head.path.join();
                    if (isCollapsed(sel) && sel.head.offset > 0 && sameBlock && range.from.offset < range.to.offset && unit !== 'char') {
                        editor.apply(deleteBetween(editor.state, range!.from, range!.to), { origin: 'user', history: 'delete' });
                    } else editor.backspace(unit);
                }
                break;
            case 'deleteContentForward':
            case 'deleteWordForward':
            case 'deleteSoftLineForward':
            case 'deleteHardLineForward':
                if (selectedAtom) deleteSelectedAtom();
                else editor.apply(deleteForward(editor.state, unit), { origin: 'user', history: 'delete' });
                break;
            case 'deleteByCut':
            case 'deleteByDrag':
            case 'deleteContent':
                editor.run('deleteSelection');
                break;
            case 'insertFromPaste':
            case 'insertFromDrop':
            case 'insertFromYank':
            case 'insertFromPasteAsQuotation':
                insertTransfer(event.dataTransfer);
                break;
            case 'historyUndo':
                editor.undo();
                break;
            case 'historyRedo':
                editor.redo();
                break;
            case 'formatBold':
                editor.run('toggleBold');
                break;
            case 'formatItalic':
                editor.run('toggleItalic');
                break;
            case 'formatUnderline':
                editor.run('toggleUnderline');
                break;
            case 'formatStrikeThrough':
                editor.run('toggleStrike');
                break;
            case 'formatRemove':
                editor.run('clearFormatting');
                break;
            case 'formatIndent':
                editor.run('indent');
                break;
            case 'formatOutdent':
                editor.run('outdent');
                break;
            case 'insertOrderedList':
                editor.run('toggleOrderedList');
                break;
            case 'insertUnorderedList':
                editor.run('toggleBulletList');
                break;
            case 'insertHorizontalRule':
                editor.run('insertHorizontalRule');
                break;
            case 'insertLink':
                if (event.data) editor.run('setLink', event.data);
                break;
            default:
                // Anything else would change the DOM behind the document's back.
                break;
        }
        // A command that changed nothing still has to put the caret back where the model has it.
        update();
    }

    function deleteSelectedAtom() {
        if (!selectedAtom) return;
        const path = selectedAtom;
        selectedAtom = null;
        editor.run('deleteNode', path);
    }

    function onKeydown(event: KeyboardEvent) {
        if (event.isComposing || event.keyCode === 229) return;
        const name = keyName(event);
        const binding = keymap[name];
        if (options.handleKey?.(name, binding, event)) {
            event.preventDefault();
            return;
        }
        if (selectedAtom) {
            if (event.key === 'Backspace' || event.key === 'Delete') {
                event.preventDefault();
                if (editable()) deleteSelectedAtom();
                update();
                return;
            }
            if (!event.metaKey && !event.ctrlKey && !event.altKey && event.key.length > 1 && event.key !== 'Shift') {
                selectedAtom = null;
                paintAtomSelection();
            }
        }
        if (!binding) return;
        const [command, ...args] = binding;
        if (command === 'openLink') {
            // Read or written, the link under the caret is followed; with none
            // there, Alt+Enter is left to whatever else wants it.
            readSelection();
            const link = linkAt(editor.state);
            const href = link ? sanitizeUrl(link.href, 'link') : null;
            if (!href) return;
            event.preventDefault();
            followEditorLink(href);
            return;
        }
        if (command === 'selectAll' || command === 'link' || command === 'toolbar') return;
        if (!editable()) return;
        readSelection();
        switch (command) {
            case 'enter':
                event.preventDefault();
                editor.enter();
                break;
            case 'indent':
            case 'outdent':
                // Tab leaves the editor unless it means something here.
                if (editor.run(command)) event.preventDefault();
                break;
            default:
                event.preventDefault();
                (editor.run as (n: string, ...a: unknown[]) => boolean)(command, ...args);
        }
        update();
    }

    function onCompositionStart() {
        const { from, to, empty } = selectionRange(editor.state.selection);
        if (!empty && from.path.join() !== to.path.join()) {
            // A composition over several blocks would merge them in the DOM; do it in the document first.
            editor.run('deleteSelection');
            update();
        }
        pending = [];
        observer?.takeRecords();
        composing = true;
    }

    function onCompositionEnd() {
        composing = false;
        // Some browsers send the last input after this event; read once it has landed.
        setTimeout(() => {
            if (composing) return;
            readDOM();
            update();
        });
    }

    function onInput(event: Event) {
        if (composing || (event as InputEvent).isComposing) return;
        readDOM();
        update();
    }

    function onSelectionChange() {
        if (!hasFocus() || composing || rendering) return;
        readSelection();
        if (selectedAtom) {
            selectedAtom = null;
            paintAtomSelection();
        }
    }

    function onPaste(event: ClipboardEvent) {
        event.preventDefault();
        if (!editable()) return;
        readSelection();
        insertTransfer(event.clipboardData);
        update();
    }

    function onDrop(event: DragEvent) {
        event.preventDefault();
        if (!editable() || !event.dataTransfer) return;
        const d = doc as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
        let point: { node: Node; offset: number } | null = null;
        if (d.caretPositionFromPoint) {
            const p = d.caretPositionFromPoint(event.clientX, event.clientY);
            if (p) point = { node: p.offsetNode, offset: p.offset };
        } else if (doc.caretRangeFromPoint) {
            const r = doc.caretRangeFromPoint(event.clientX, event.clientY);
            if (r) point = { node: r.startContainer, offset: r.startOffset };
        }
        const pos = point ? posFromDOM(point.node, point.offset) : null;
        if (pos) editor.setSelection({ anchor: pos, head: pos });
        insertTransfer(event.dataTransfer);
        root.focus();
        update();
    }

    function onDragStart(event: DragEvent) {
        // Moving content by dragging inside the editor is not supported; copy and paste is.
        event.preventDefault();
    }

    function onMousedown(event: MouseEvent) {
        pointerDown = true;
        const target = event.target as Element;
        const box = target.closest?.('input[type="checkbox"]');
        if (box && root.contains(box)) {
            event.preventDefault();
            return;
        }
        const atom = target.closest?.('[contenteditable="false"][data-type]');
        if (atom && atomPaths.has(atom)) {
            event.preventDefault();
            selectedAtom = atomPaths.get(atom)!;
            if (!hasFocus()) root.focus({ preventScroll: true });
            paintAtomSelection();
        } else if (selectedAtom) {
            selectedAtom = null;
            paintAtomSelection();
        }
    }

    function onMouseup() {
        pointerDown = false;
    }

    /** The link an event happened on, when it is one of the document's. */
    function linkOf(target: EventTarget | null): HTMLAnchorElement | null {
        const a = (target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
        return a && root.contains(a) ? a : null;
    }

    // Clicking a link while writing places the caret in it, as it must, so
    // following it takes Ctrl (⌘ on a Mac) — the convention of every editor
    // where text and links share the page. Shift is not used: Shift+click
    // extends the selection.
    function onLinkClick(event: MouseEvent): boolean {
        const a = linkOf(event.target);
        if (!a || !editable()) return false;
        const mod = isMacPlatform() ? event.metaKey : event.ctrlKey;
        if (!mod) return false;
        event.preventDefault();
        clearHint();
        followEditorLink(a.getAttribute('href') ?? '');
        return true;
    }

    // The tooltip over a link: one at a time, made for the link under the
    // pointer and given up when it moves on.
    let hint: { link: HTMLAnchorElement; tip: TooltipHandle } | null = null;
    let hintTimer: ReturnType<typeof setTimeout> | undefined;
    function clearHint() {
        clearTimeout(hintTimer);
        hint?.tip.destroy();
        hint = null;
    }
    function onMouseover(event: MouseEvent) {
        const link = linkOf(event.target);
        if (link === hint?.link) return;
        clearHint();
        if (!link || !options.linkHint || !editable()) return;
        const settings = options.linkHint(link.getAttribute('href') ?? '');
        if (!settings) return;
        const tip = createTooltip(link, settings);
        hint = { link, tip };
        // The pointer is already over it, so the tooltip's own hover has been missed.
        hintTimer = setTimeout(() => tip.show(), settings.showDelay ?? 0);
    }

    function onClick(event: MouseEvent) {
        if (onLinkClick(event)) return;
        const box = (event.target as Element).closest?.('input[type="checkbox"]');
        if (!box || !root.contains(box)) return;
        event.preventDefault();
        if (!editable()) return;
        const li = box.closest('li');
        const path = li ? pathOfItem(li) : null;
        if (path) editor.run('toggleTaskItem', path);
        update();
    }

    function pathOfItem(li: Element): number[] | null {
        const body = li.querySelector(':scope > div');
        const first = body?.firstElementChild;
        const path = first ? (blockPaths.get(first) ?? atomPaths.get(first)) : null;
        if (path) return path.slice(0, -1);
        // The item starts with a list or quote: find any block inside and walk up to the item.
        for (const [element, p] of blockPaths) {
            if (li.contains(element)) {
                let depth = p.length;
                let n: Element | null = element;
                while (n && n !== li) {
                    if (nodeOf.has(n) && n !== element) depth--;
                    n = n.parentElement;
                }
                return p.slice(0, depth - 1);
            }
        }
        return null;
    }

    function onFocus() {
        if (pointerDown) return;
        // Coming back from the toolbar: the caret goes where the document has it.
        writeSelection();
    }

    const listeners: [EventTarget, string, EventListener][] = [
        [root, 'beforeinput', onBeforeInput as EventListener],
        [root, 'input', onInput],
        [root, 'keydown', onKeydown as EventListener],
        [root, 'compositionstart', onCompositionStart],
        [root, 'compositionend', onCompositionEnd],
        [root, 'paste', onPaste as EventListener],
        [root, 'drop', onDrop as EventListener],
        [root, 'dragstart', onDragStart as EventListener],
        [root, 'mousedown', onMousedown as EventListener],
        [root, 'click', onClick as EventListener],
        [root, 'mouseover', onMouseover as EventListener],
        [root, 'mouseleave', clearHint],
        [root, 'focus', onFocus],
        [doc, 'mouseup', onMouseup],
        [doc, 'selectionchange', onSelectionChange]
    ];
    for (const [target, type, fn] of listeners) target.addEventListener(type, fn);

    const unsubscribe = editor.subscribe(() => update());
    root.innerHTML = '';
    render(true);

    return {
        dom: root,
        update,
        focus() {
            root.focus({ preventScroll: true });
            writeSelection();
        },
        hasFocus,
        selectionRect() {
            const sel = domSelection();
            if (sel && sel.rangeCount && root.contains(sel.anchorNode)) {
                const range = sel.getRangeAt(0);
                const rect = typeof range.getBoundingClientRect === 'function' ? range.getBoundingClientRect() : null;
                if (rect && (rect.width || rect.height)) return rect;
                const rects = typeof range.getClientRects === 'function' ? range.getClientRects() : null;
                if (rects?.length) return rects[0]!;
            }
            const block = blockByKey.get(editor.state.selection.head.path.join('.'));
            return block?.getBoundingClientRect?.() ?? null;
        },
        posFromDOM,
        domFromPos,
        readSelection,
        readDOM,
        destroy() {
            destroyed = true;
            clearHint();
            unsubscribe();
            observer?.disconnect();
            for (const [target, type, fn] of listeners) target.removeEventListener(type, fn);
        }
    };
}


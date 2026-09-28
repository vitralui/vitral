import { editorInlineText, editorNodeAt, en, findInEditor, formatMessage, replaceEditorMatches, type EditorFindOptions, type EditorInstance, type EditorMatch, type EditorView, type Locale } from '@vitral/core';
import { h, mergeAttrs, type Child, type Props } from '@vitral/dom';
import { iconView } from './render/toolbar';

/**
 * The bar that finds words in an editor and replaces them, over the text the
 * way a code editor's does. Every match is painted with the CSS Custom
 * Highlight API — nothing is added to the document, so the words stay what
 * they are for undo, for a screen reader and for the caret — and where a
 * browser has no highlights the count and the selection still work.
 */

export interface FindBarOptions {
    editor: EditorInstance;
    view: () => EditorView | null;
    part: (name: string, state?: unknown) => Props;
    locale?: () => Locale;
    /** Whether the words can be changed; without it the bar only finds. */
    editable?: () => boolean;
    /** The bar changed and wants drawing again. */
    render: () => void;
    id?: string;
}

export interface FindBar {
    readonly isOpen: boolean;
    open(options?: { replace?: boolean; query?: string }): void;
    close(options?: { focusEditor?: boolean }): void;
    /** The document changed: find again and repaint. */
    sync(): void;
    view(): Child;
    matches(): readonly EditorMatch[];
    destroy(): void;
}

// Highlights are named for the whole page, so every bar adds its ranges to
// one shared set and the set is rebuilt from all of them.
const painted = new Map<object, { all: Range[]; current: Range | null }>();

function repaint() {
    const registry = typeof CSS !== 'undefined' ? (CSS as unknown as { highlights?: Map<string, unknown> }).highlights : undefined;
    const Highlight = (globalThis as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight;
    if (!registry || !Highlight) return;
    const all: Range[] = [];
    const current: Range[] = [];
    for (const entry of painted.values()) {
        all.push(...entry.all);
        if (entry.current) current.push(entry.current);
    }
    if (all.length) registry.set('vt-find', new Highlight(...all));
    else registry.delete('vt-find');
    if (current.length) registry.set('vt-find-current', new Highlight(...current));
    else registry.delete('vt-find-current');
}

export function createFindBar(options: FindBarOptions): FindBar {
    const key = {};
    const locale = () => options.locale?.() ?? en;
    const editable = () => options.editable?.() ?? true;
    const id = options.id ?? 'vt-find';
    let isOpen = false;
    let replacing = false;
    let query = '';
    let replacement = '';
    const flags: Required<EditorFindOptions> = { caseSensitive: false, wholeWord: false, regex: false };
    let found: EditorMatch[] = [];
    let current = 0;
    let input: HTMLInputElement | null = null;
    let wantFocus = false;
    let scrollToCurrent = false;

    function search() {
        found = isOpen ? findInEditor(options.editor.state.doc, query, flags) : [];
        if (current >= found.length) current = Math.max(0, found.length - 1);
    }

    /** The first match at or after the caret, so opening the bar starts where the reader is. */
    function nearestToCaret() {
        const head = options.editor.state.selection.head;
        const index = found.findIndex((m) => {
            const order = m.path.join('.').localeCompare(head.path.join('.'), undefined, { numeric: true });
            return order > 0 || (order === 0 && m.to > head.offset);
        });
        current = index === -1 ? 0 : index;
    }

    function rangeOf(match: EditorMatch): Range | null {
        const view = options.view();
        const start = view?.domFromPos({ path: match.path, offset: match.from });
        const end = view?.domFromPos({ path: match.path, offset: match.to });
        if (!start || !end || typeof document === 'undefined') return null;
        try {
            const range = document.createRange();
            range.setStart(start.node, start.offset);
            range.setEnd(end.node, end.offset);
            return range;
        } catch {
            return null;
        }
    }

    // The view draws the document after the handle hears of a change, so the
    // ranges are taken once it has.
    let queued = false;
    function paint() {
        if (queued) return;
        queued = true;
        queueMicrotask(() => {
            queued = false;
            if (wantFocus && input) {
                wantFocus = false;
                input.focus();
                input.select();
            }
            if (!isOpen || !found.length) {
                painted.delete(key);
                repaint();
                return;
            }
            const all = found.map(rangeOf).filter((r): r is Range => !!r);
            const now = found[current] ? rangeOf(found[current]!) : null;
            painted.set(key, { all, current: now });
            repaint();
            if (scrollToCurrent && now) {
                scrollToCurrent = false;
                const block = now.startContainer.nodeType === 1 ? (now.startContainer as Element) : now.startContainer.parentElement;
                block?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
            }
        });
    }

    function changed() {
        search();
        options.render();
        paint();
    }

    function go(step: number) {
        if (!found.length) return;
        current = (current + step + found.length) % found.length;
        scrollToCurrent = true;
        options.render();
        paint();
    }

    /** Leaves the current match selected in the document, where Escape takes the reader. */
    function selectCurrent() {
        const match = found[current];
        if (!match) return;
        options.editor.setSelection({ anchor: { path: match.path, offset: match.from }, head: { path: match.path, offset: match.to } });
    }

    function replaceOne() {
        const match = found[current];
        if (!match || !editable()) return;
        options.editor.apply(replaceEditorMatches(options.editor.state, [match], replacement, flags), { origin: 'user', history: 'other' });
        search();
        scrollToCurrent = true;
        options.render();
        paint();
    }

    function replaceAll() {
        if (!found.length || !editable()) return;
        options.editor.apply(replaceEditorMatches(options.editor.state, found, replacement, flags), { origin: 'user', history: 'other' });
        search();
        options.render();
        paint();
    }

    const close: FindBar['close'] = ({ focusEditor = true } = {}) => {
        if (!isOpen) return;
        if (focusEditor) selectCurrent();
        isOpen = false;
        found = [];
        painted.delete(key);
        repaint();
        options.render();
        if (focusEditor) options.view()?.focus();
    };

    const toggle = (name: keyof EditorFindOptions, label: string, glyph: string): Child =>
        h(
            'button',
            mergeAttrs({ key: name, type: 'button' }, options.part('findToggle', { active: flags[name] }), {
                'aria-label': label,
                'aria-pressed': flags[name] ? 'true' : 'false',
                title: label,
                onClick: () => {
                    flags[name] = !flags[name];
                    changed();
                }
            }),
            glyph
        );

    const iconButton = (name: string, label: string, icon: string, onClick: () => void, disabled = false): Child =>
        h(
            'button',
            mergeAttrs({ key: name, type: 'button' }, options.part('button', { disabled }), { 'aria-label': label, title: label, disabled, onClick }),
            iconView(icon, options.part('buttonIcon'))
        );

    function view(): Child {
        if (!isOpen) return null;
        const words = locale().editor;
        const canReplace = editable();
        const count = !query ? '' : found.length ? formatMessage(words.matchCount, { current: current + 1, total: found.length }) : words.noMatches;
        const keydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                close();
            }
        };
        return h(
            'div',
            mergeAttrs({ key: 'find', id, role: 'search' }, options.part('find'), { 'aria-label': words.find, onKeydown: keydown }),
            h(
                'div',
                mergeAttrs({ key: 'row' }, options.part('findRow')),
                canReplace
                    ? h(
                          'button',
                          mergeAttrs({ key: 'expand', type: 'button' }, options.part('button'), {
                              'aria-label': words.toggleReplace,
                              title: words.toggleReplace,
                              'aria-expanded': replacing ? 'true' : 'false',
                              'aria-controls': `${id}-replace`,
                              onClick: () => {
                                  replacing = !replacing;
                                  options.render();
                              }
                          }),
                          iconView(replacing ? 'chevronDown' : 'chevronRight', options.part('buttonIcon'))
                      )
                    : null,
                h(
                    'span',
                    { key: 'query', class: 'vt-field vt-field-sm vt-editor-find-field' },
                    h('input', {
                        type: 'text',
                        class: 'vt-field-input',
                        value: query,
                        placeholder: words.find,
                        'aria-label': words.find,
                        'aria-describedby': `${id}-count`,
                        spellcheck: 'false',
                        ref: (el: Element | null) => (input = el as HTMLInputElement | null),
                        onInput: (event: Event) => {
                            query = (event.target as HTMLInputElement).value;
                            search();
                            nearestToCaret();
                            scrollToCurrent = true;
                            options.render();
                            paint();
                        },
                        onKeydown: (event: KeyboardEvent) => {
                            if (event.key !== 'Enter') return;
                            event.preventDefault();
                            go(event.shiftKey ? -1 : 1);
                        }
                    })
                ),
                toggle('caseSensitive', words.matchCase, 'Aa'),
                toggle('wholeWord', words.wholeWord, 'ab'),
                toggle('regex', words.useRegex, '.*'),
                h('span', mergeAttrs({ key: 'count', id: `${id}-count`, 'aria-live': 'polite' }, options.part('findCount', { empty: !!query && !found.length })), count),
                iconButton('prev', words.previousMatch, 'chevronUp', () => go(-1), !found.length),
                iconButton('next', words.nextMatch, 'chevronDown', () => go(1), !found.length),
                iconButton('close', words.closeFind, 'close', () => close())
            ),
            canReplace && replacing
                ? h(
                      'div',
                      mergeAttrs({ key: 'replace', id: `${id}-replace` }, options.part('findRow', { replace: true })),
                      h(
                          'span',
                          { key: 'with', class: 'vt-field vt-field-sm vt-editor-find-field' },
                          h('input', {
                              type: 'text',
                              class: 'vt-field-input',
                              value: replacement,
                              placeholder: words.replaceWith,
                              'aria-label': words.replaceWith,
                              spellcheck: 'false',
                              onInput: (event: Event) => (replacement = (event.target as HTMLInputElement).value),
                              onKeydown: (event: KeyboardEvent) => {
                                  if (event.key !== 'Enter') return;
                                  event.preventDefault();
                                  if (event.ctrlKey || event.metaKey) replaceAll();
                                  else replaceOne();
                              }
                          })
                      ),
                      h('button', { key: 'one', type: 'button', class: 'vt-button vt-button-text vt-button-secondary vt-button-sm', disabled: !found.length, onClick: replaceOne }, words.replace),
                      h('button', { key: 'all', type: 'button', class: 'vt-button vt-button-text vt-button-secondary vt-button-sm', disabled: !found.length, onClick: replaceAll }, words.replaceAll)
                  )
                : null
        );
    }

    return {
        get isOpen() {
            return isOpen;
        },
        open({ replace = false, query: next } = {}) {
            // What is selected is what the reader wants to find, when it is a few words on one line.
            const { anchor, head } = options.editor.state.selection;
            if (next === undefined && anchor.path.join() === head.path.join() && anchor.offset !== head.offset) {
                const block = editorNodeAt(options.editor.state.doc, anchor.path);
                const selected = editorInlineText(block?.content).slice(Math.min(anchor.offset, head.offset), Math.max(anchor.offset, head.offset));
                if (selected && !/[\n\ufffc]/.test(selected) && selected.length <= 200) next = selected;
            }
            if (next !== undefined) query = next;
            isOpen = true;
            replacing = replace && editable() ? true : replacing && editable();
            wantFocus = true;
            search();
            nearestToCaret();
            scrollToCurrent = true;
            options.render();
            paint();
        },
        close,
        sync() {
            if (!isOpen) return;
            search();
            paint();
        },
        view,
        matches: () => found,
        destroy() {
            painted.delete(key);
            repaint();
        }
    };
}

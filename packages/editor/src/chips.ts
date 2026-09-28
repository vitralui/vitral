import { editorSelectionRange, editorTextblocks, en, EDITOR_CHIP_CHAR, type EditorInstance, type EditorNode, type Locale } from '@vitral/core';
import { createOverlay, type OverlayTarget } from '@vitral/controls';
import type { Props } from '@vitral/dom';
import { slashMenuView } from './render/menus';
import type { ChipSuggestion, ChipTrigger } from './types';

/**
 * The suggestions a chip trigger opens — `@` for people, `#` for tags — as a
 * piece that attaches to any editor, the way the slash menu does. It opens
 * when a trigger starts a word, asks for suggestions as the word is typed
 * (and throws away an answer that arrives after a newer one), and puts the
 * chosen one in as a chip in place of the trigger and the words after it.
 */

export interface ChipMenuOptions {
    editor: EditorInstance;
    /** The `contenteditable` element, where the keys are heard. */
    content: () => HTMLElement | null;
    /** What the list hangs from: an element over the caret. */
    anchor: () => HTMLElement | null;
    /** The triggers; read every time the document changes. */
    triggers: () => ChipTrigger[];
    part: (name: string, state?: unknown) => Props;
    locale?: () => Locale;
    enabled?: () => boolean;
    /** Puts the anchor where the caret is, before the list opens. */
    place?: () => void;
    /** The list's id, for the options' ids and `aria-controls`. */
    id?: string;
    overlayTarget?: OverlayTarget;
    zIndex?: number;
    /** A chip was put in. */
    onInsert?: (suggestion: ChipSuggestion) => void;
}

export interface ChipMenu {
    readonly isOpen: boolean;
    sync(): void;
    close(): void;
    destroy(): void;
}

interface OpenState {
    trigger: ChipTrigger;
    query: string;
    items: ChipSuggestion[];
    active: number;
}

export function createChipMenu(options: ChipMenuOptions): ChipMenu {
    let open: OpenState | null = null;
    let element: HTMLElement | null = null;
    /** Bumped by every query, so a slow answer to an old one is dropped. */
    let asked = 0;

    const locale = () => options.locale?.() ?? en;
    const enabled = () => options.enabled?.() ?? true;
    const id = options.id ?? 'vt-chips';

    const overlay = createOverlay({
        anchor: options.anchor,
        render: () =>
            open
                ? (slashMenuView(
                      { locale: locale(), part: options.part, ids: { slash: id, block: `${id}-block` } },
                      {
                          id,
                          query: open.query,
                          items: open.items.map((s) => ({ id: s.id, label: s.label, description: s.description, icon: s.icon })),
                          active: open.active,
                          labels: { list: locale().editor.chipMenu, empty: locale().editor.chipEmpty }
                      },
                      { choose: insert }
                  ) as never)
                : null,
        placement: 'bottom-start',
        target: () => options.overlayTarget,
        zIndex: options.zIndex,
        restoreFocus: false,
        onClose: () => (open = null)
    });

    /** The text of the caret's block up to the caret; a chip already in it reads as one character. */
    function textBeforeCaret(): string | null {
        const state = options.editor.state;
        if (!editorSelectionRange(state.selection).empty) return null;
        const path = state.selection.head.path.join('.');
        const block = editorTextblocks(state.doc).find((entry) => entry.path.join('.') === path)?.node as EditorNode | undefined;
        if (!block || block.type === 'codeBlock') return null;
        const text = (block.content ?? []).map((child) => (child.type === 'text' ? (child.text ?? '') : child.type === 'chip' ? EDITOR_CHIP_CHAR : '\n')).join('');
        return text.slice(0, state.selection.head.offset);
    }

    /** The trigger that starts the word the caret is in, and the words after it. */
    function find(): { trigger: ChipTrigger; query: string } | null {
        const before = textBeforeCaret();
        if (before === null) return null;
        let best: { trigger: ChipTrigger; query: string; at: number } | null = null;
        for (const trigger of options.triggers()) {
            const char = trigger.char ?? '@';
            const at = before.lastIndexOf(char);
            if (at < 0) continue;
            const starts = at === 0 || /\s/.test(before[at - 1] ?? '');
            const query = before.slice(at + char.length);
            // A mention is a word or two: a new line, or a second space, ends the search.
            if (!starts || /\n|\s{2}/.test(query) || query.includes(EDITOR_CHIP_CHAR) || query.length > 40) continue;
            if (!best || at > best.at) best = { trigger, query, at };
        }
        return best ? { trigger: best.trigger, query: best.query } : null;
    }

    function sync() {
        if (!enabled()) return close();
        const found = find();
        if (!found) return close();
        const same = open && open.trigger === found.trigger && open.query === found.query;
        if (same) return;
        const ask = ++asked;
        const answer = found.trigger.items(found.query);
        const show = (items: ChipSuggestion[]) => {
            if (ask !== asked) return;
            open = { trigger: found.trigger, query: found.query, items, active: open && open.query === found.query ? open.active : 0 };
            options.place?.();
            overlay.open();
            overlay.update();
        };
        if (answer instanceof Promise) answer.then(show, () => show([]));
        else show(answer);
    }

    function close() {
        asked++;
        if (!overlay.isOpen) {
            open = null;
            return;
        }
        overlay.close();
    }

    /** Takes the trigger and its words out, and puts the chip in their place. */
    function insert(index: number) {
        if (!open) return;
        const suggestion = open.items[index];
        if (!suggestion) return;
        const remove = open.query.length + (open.trigger.char ?? '@').length;
        const kind = suggestion.kind ?? open.trigger.kind ?? null;
        close();
        for (let n = 0; n < remove; n++) options.editor.backspace('char');
        (options.editor.run as (name: string, ...args: unknown[]) => boolean)('insertChip', { id: suggestion.id, label: suggestion.label, kind });
        options.onInsert?.(suggestion);
    }

    /** While the list is open those keys are the list's, heard before the editor hears them. */
    function onKeydown(event: KeyboardEvent) {
        if (!open) return;
        const count = open.items.length;
        const take = () => {
            event.preventDefault();
            event.stopImmediatePropagation();
        };
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            if (!count) return;
            take();
            open = { ...open, active: (open.active + (event.key === 'ArrowDown' ? 1 : -1) + count) % count };
            overlay.update();
        } else if (event.key === 'Enter' || event.key === 'Tab') {
            if (!count) return;
            take();
            insert(open.active);
        } else if (event.key === 'Escape') {
            take();
            close();
        }
    }

    function listen() {
        const next = options.content();
        if (next === element) return;
        element?.removeEventListener('keydown', onKeydown, true);
        element = next;
        element?.addEventListener('keydown', onKeydown, true);
    }

    const stop = options.editor.subscribe(() => {
        listen();
        sync();
    });
    listen();

    return {
        get isOpen() {
            return overlay.isOpen;
        },
        sync() {
            listen();
            sync();
        },
        close,
        destroy() {
            stop();
            element?.removeEventListener('keydown', onKeydown, true);
            element = null;
            overlay.destroy();
        }
    };
}

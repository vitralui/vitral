import { editorSelectionRange, editorTextblocks, en, type EditorInstance, type EditorNode, type Locale } from '@vitral/core';
import { createOverlay, type OverlayTarget } from '@vitral/controls';
import type { Props } from '@vitral/dom';
import { slashMenuView } from './render/menus';
import type { CommandRunner, SlashCommand } from './types';

/**
 * The menu a `/` opens, as a piece that attaches to any editor: the
 * framework-free one uses it, and so does a framework component that draws its
 * own toolbar. It watches the document, opens when a slash starts a word,
 * filters as it is typed, and takes the keys it needs while it is open.
 */

export interface SlashMenuOptions {
    editor: EditorInstance;
    /** The `contenteditable` element, where the keys are heard. */
    content: () => HTMLElement | null;
    /** What the menu hangs from: an element over the caret. */
    anchor: () => HTMLElement | null;
    /** The commands on offer; a function is read every time it opens. */
    commands: () => SlashCommand[];
    /** The classes and pass-through of the menu's parts. */
    part: (name: string, state?: unknown) => Props;
    locale?: () => Locale;
    /** Off while the editor is read-only. */
    enabled?: () => boolean;
    /** Puts the anchor where the caret is, before the menu opens. */
    place?: () => void;
    ids?: { slash: string; block: string };
    overlayTarget?: OverlayTarget;
    zIndex?: number;
    /** What to do with the command the reader chose; it runs itself by default. */
    onRun?: (command: SlashCommand) => void;
}

export interface SlashMenu {
    readonly isOpen: boolean;
    /** Reads the document again: called on every change. */
    sync(): void;
    close(): void;
    destroy(): void;
}

export function createSlashMenu(options: SlashMenuOptions): SlashMenu {
    let open: { query: string; active: number } | null = null;
    let element: HTMLElement | null = null;

    const locale = () => options.locale?.() ?? en;
    const ids = options.ids ?? { slash: 'vt-slash', block: 'vt-block' };
    const enabled = () => options.enabled?.() ?? true;

    /** What the query after the slash matches, by label, id and keyword. */
    function matches(query: string): SlashCommand[] {
        const needle = query.trim().toLocaleLowerCase(locale().code);
        const all = options.commands();
        if (!needle) return all;
        return all.filter((item) => [item.label, item.id, ...(item.keywords ?? [])].some((word) => word.toLocaleLowerCase(locale().code).includes(needle)));
    }

    const overlay = createOverlay({
        anchor: options.anchor,
        render: () =>
            open
                ? (slashMenuView({ locale: locale(), part: options.part, ids }, { query: open.query, items: matches(open.query), active: open.active }, { choose: run }) as never)
                : null,
        placement: 'bottom-start',
        target: () => options.overlayTarget,
        zIndex: options.zIndex,
        restoreFocus: false,
        onClose: () => (open = null)
    });

    /** The text of the block the caret is in, and where the caret is in it. */
    function caretText(): { text: string; offset: number } | null {
        const state = options.editor.state;
        if (!editorSelectionRange(state.selection).empty) return null;
        const blocks = editorTextblocks(state.doc);
        const path = state.selection.head.path;
        const block = blocks.find((entry) => entry.path.join('.') === path.join('.'))?.node ?? (path[0] === undefined ? undefined : (state.doc.content?.[path[0]] as EditorNode | undefined));
        if (!block) return null;
        const text = (block.content ?? []).map((child) => (typeof child === 'string' ? child : (child.text ?? ''))).join('');
        return { text, offset: state.selection.head.offset };
    }

    function sync() {
        if (!enabled()) return close();
        const caret = caretText();
        if (!caret) return close();
        const before = caret.text.slice(0, caret.offset);
        const at = before.lastIndexOf('/');
        const starts = at === 0 || (at > 0 && /\s/.test(before[at - 1] ?? ''));
        if (at < 0 || !starts) return close();
        const query = before.slice(at + 1);
        if (/\s/.test(query)) return close();
        open = { query, active: open && open.query === query ? open.active : 0 };
        options.place?.();
        overlay.open();
        overlay.update();
    }

    function close() {
        if (!overlay.isOpen) {
            open = null;
            return;
        }
        overlay.close();
    }

    /** Runs what the menu was pointing at, after taking the slash and its query out. */
    function run(index: number) {
        const items = matches(open?.query ?? '');
        const item = items[index];
        if (!item || !open) return;
        const remove = open.query.length + 1;
        close();
        for (let n = 0; n < remove; n++) options.editor.backspace('char');
        if (options.onRun) options.onRun(item);
        // An entry's own `run` is what an application writes a command of its
        // own with: without this it was only ever called by a host that passed
        // `onRun`, so a slash command with a `run` did nothing in Vue.
        else if (item.run) item.run(options.editor as unknown as CommandRunner);
        else if (item.command) (options.editor.run as (name: string, ...args: unknown[]) => boolean)(item.command[0], ...item.command.slice(1));
    }

    /**
     * While the menu is open those keys are the menu's. The listener is a
     * capturing one: the editor's own view listens on the same element, and an
     * Enter it heard would split the block the command is about to change.
     */
    function onKeydown(event: KeyboardEvent) {
        if (!open) return;
        const items = matches(open.query);
        const take = () => {
            event.preventDefault();
            event.stopImmediatePropagation();
        };
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            take();
            const step = event.key === 'ArrowDown' ? 1 : -1;
            open = { ...open, active: (open.active + step + items.length) % Math.max(1, items.length) };
            overlay.update();
            return;
        }
        if (event.key === 'Home' || event.key === 'End') {
            take();
            open = { ...open, active: event.key === 'Home' ? 0 : Math.max(0, items.length - 1) };
            overlay.update();
            return;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
            if (!items.length) return;
            take();
            run(open.active);
            return;
        }
        if (event.key === 'Escape') {
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
    // The document may already be mid-word: a menu attached after a slash was
    // typed (a re-attach, a component that mounted late) opens straight away.
    sync();

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

/** The blocks a slash offers when an application names none. */
export function defaultSlashCommands(locale: Locale): SlashCommand[] {
    const words = locale.editor;
    const entry = (id: string, icon: string, command: readonly [string, ...unknown[]]): SlashCommand => ({
        id,
        icon,
        label: words.slashCommands[id] ?? id,
        description: words.slashHints[id],
        command
    });
    return [
        entry('paragraph', 'pilcrow', ['setParagraph']),
        entry('heading1', 'heading1', ['toggleHeading', 1]),
        entry('heading2', 'heading2', ['toggleHeading', 2]),
        entry('heading3', 'heading3', ['toggleHeading', 3]),
        entry('bulletList', 'list', ['toggleBulletList']),
        entry('orderedList', 'listOrdered', ['toggleOrderedList']),
        entry('taskList', 'listChecks', ['toggleTaskList']),
        entry('blockquote', 'quote', ['toggleBlockquote']),
        entry('codeBlock', 'codeBlock', ['toggleCodeBlock']),
        entry('horizontalRule', 'horizontalRule', ['insertHorizontalRule']),
        entry('table', 'table', ['insertTable', 3, 3, true]),
        entry('image', 'image', ['insertImage', { src: '' }])
    ];
}

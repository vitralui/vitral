import { editorSelectionRange, en, type EditorInstance, type EditorNode, type Locale } from '@vitral/core';
import { createOverlay, type OverlayTarget } from '@vitral/controls';
import { createRoot, type Props } from '@vitral/dom';
import { blockMenuView } from './render/menus';
import { iconView } from './render/toolbar';
import type { BlockAction } from './types';

/**
 * The handle beside the block the caret is in, and the menu it opens: a piece
 * that attaches to any editor, so the framework-free editor and a framework
 * component that draws its own toolbar both get it from here.
 */

export interface BlockHandleOptions {
    editor: EditorInstance;
    /** Where the handle is put: the editor's own box, which it is positioned against. */
    host: () => HTMLElement | null;
    /** The rectangle of the caret, from the editor's view. */
    caretRect: () => { top: number; left: number; height: number } | null;
    actions: () => BlockAction[];
    part: (name: string, state?: unknown) => Props;
    locale?: () => Locale;
    enabled?: () => boolean;
    ids?: { slash: string; block: string };
    overlayTarget?: OverlayTarget;
    zIndex?: number;
}

export interface BlockHandle {
    /** Reads the document and the caret again: called on every change. */
    sync(): void;
    close(): void;
    destroy(): void;
}

export function createBlockHandle(options: BlockHandleOptions): BlockHandle {
    let button: HTMLButtonElement | null = null;
    let root: ReturnType<typeof createRoot> | null = null;
    let host: HTMLElement | null = null;

    const locale = () => options.locale?.() ?? en;
    const ids = options.ids ?? { slash: 'vt-slash', block: 'vt-block' };
    const enabled = () => options.enabled?.() ?? true;

    /** The top-level block the caret is in. */
    function block(): { node: EditorNode; index: number } | null {
        const state = options.editor.state;
        const index = editorSelectionRange(state.selection).from.path[0];
        const node = index === undefined ? undefined : (state.doc.content?.[index] as EditorNode | undefined);
        return node ? { node, index } : null;
    }

    const overlay = createOverlay({
        anchor: () => button,
        render: () => {
            const current = block();
            return current ? (blockMenuView({ locale: locale(), part: options.part, ids }, current.node, options.actions(), { choose: run }) as never) : null;
        },
        placement: 'bottom-start',
        target: () => options.overlayTarget,
        zIndex: options.zIndex
    });

    function run(id: string) {
        const current = block();
        const action = options.actions().find((entry) => entry.id === id);
        overlay.close();
        if (!current || !action) return;
        action.run(options.editor, current.node, current.index);
    }

    /** The handle is the editor's own element, not the document's: it is never edited. */
    function ensure(): HTMLButtonElement | null {
        const next = options.host();
        if (!next) return null;
        if (host !== next) {
            remove();
            host = next;
        }
        if (button) return button;
        button = host.ownerDocument.createElement('button');
        host.appendChild(button);
        root = createRoot(button);
        return button;
    }

    function remove() {
        root = null;
        button?.remove();
        button = null;
    }

    function sync() {
        if (!enabled()) {
            remove();
            overlay.close();
            return;
        }
        const handle = ensure();
        const rect = options.caretRect();
        const box = options.host()?.getBoundingClientRect();
        if (!handle || !root) return;
        root.attrs({
            ...options.part('blockHandle'),
            type: 'button',
            contenteditable: 'false',
            'aria-label': locale().editor.blockMenu,
            'aria-haspopup': 'menu',
            'aria-expanded': overlay.isOpen ? 'true' : 'false',
            style: rect && box ? { top: `${rect.top - box.top}px` } : undefined,
            // A press on the handle must not take the caret out of the text.
            onMousedown: (event: MouseEvent) => event.preventDefault(),
            onClick: () => {
                if (overlay.isOpen) overlay.close();
                else {
                    overlay.open();
                    overlay.update();
                }
                sync();
            }
        });
        root.render([iconView('grip', options.part('blockHandleIcon'))]);
    }

    const stop = options.editor.subscribe(sync);
    sync();

    return {
        sync,
        close: () => overlay.close(),
        destroy() {
            stop();
            overlay.destroy();
            remove();
            host = null;
        }
    };
}

/** What the handle offers when an application names nothing. */
export function defaultBlockActions(locale: Locale): BlockAction[] {
    const words = locale.editor.blockActions;
    const command = (name: string) => (editor: { run: (name: string, ...args: unknown[]) => boolean }) => void editor.run(name);
    return [
        { id: 'duplicate', label: words.duplicate ?? 'Duplicate', icon: 'copy', run: command('duplicateBlock') },
        { id: 'moveUp', label: words.moveUp ?? 'Move up', icon: 'arrowUp', run: command('moveBlockUp') },
        { id: 'moveDown', label: words.moveDown ?? 'Move down', icon: 'arrowDown', run: command('moveBlockDown') },
        { id: 'turnIntoParagraph', label: words.turnIntoParagraph ?? 'Turn into text', icon: 'pilcrow', run: command('setParagraph') },
        { id: 'delete', label: words.delete ?? 'Delete', icon: 'trash', run: command('deleteBlock') }
    ];
}

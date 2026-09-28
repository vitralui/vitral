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
    /** The rectangle of the caret, from the editor's view: where the handle goes when the block cannot be found. */
    caretRect: () => { top: number; left: number; height: number } | null;
    /** The element the document is drawn in; its children are the top-level blocks. */
    content?: () => HTMLElement | null;
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

    /**
     * The middle of the block's first line, in viewport pixels: the handle
     * sits level with the line a reader sees the block start on, whichever
     * line of it the caret is in. A block with no line of text (a rule, a
     * picture) is centred on as a whole.
     */
    function lineMiddle(index: number): number | null {
        const element = options.content?.()?.children[index] as HTMLElement | undefined;
        if (element?.getBoundingClientRect) {
            const box = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            const px = (value: string) => parseFloat(value) || 0;
            // A border with no style has no width, whatever the width says.
            const border = (width: string, kind: string) => (!kind || kind === 'none' || kind === 'hidden' ? 0 : px(width));
            const above = border(style.borderTopWidth, style.borderTopStyle) + px(style.paddingTop);
            const below = border(style.borderBottomWidth, style.borderBottomStyle) + px(style.paddingBottom);
            const top = box.top + above;
            const inner = box.height - above - below;
            // `normal` has no number to read; 1.2 of the font is what browsers draw it as.
            const line = px(style.lineHeight) || px(style.fontSize) * 1.2;
            const height = line > 0 && inner > 0 ? Math.min(line, inner) : inner;
            if (box.height > 0) return top + height / 2;
        }
        const caret = options.caretRect();
        return caret ? caret.top + caret.height / 2 : null;
    }

    /**
     * Puts the handle level with its block. Done now and again on the next
     * frame: a change can reflow the line it sits on — an empty line takes
     * its placeholder — after the change itself has been reported.
     */
    let frame = 0;
    function place() {
        const handle = button;
        const current = block();
        const hostEl = options.host();
        if (!handle || !hostEl) return;
        const middle = current ? lineMiddle(current.index) : null;
        const box = hostEl.getBoundingClientRect();
        // Positioned against the host's padding box, which starts inside its border.
        const size = handle.offsetHeight || handle.getBoundingClientRect().height || 0;
        // A block scrolled out of the content's view takes its handle with it.
        const view = options.content?.()?.getBoundingClientRect();
        const hidden = middle === null || (!!view && view.height > 0 && (middle < view.top || middle > view.bottom));
        if (middle !== null) handle.style.top = `${Math.round((middle - box.top - hostEl.clientTop - size / 2) * 100) / 100}px`;
        handle.style.visibility = hidden ? 'hidden' : '';
    }

    function sync() {
        if (!enabled()) {
            remove();
            overlay.close();
            return;
        }
        const handle = ensure();
        if (!handle || !root) return;
        root.attrs({
            ...options.part('blockHandle'),
            type: 'button',
            contenteditable: 'false',
            'aria-label': locale().editor.blockMenu,
            'aria-haspopup': 'menu',
            'aria-expanded': overlay.isOpen ? 'true' : 'false',
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
        place();
        if (typeof requestAnimationFrame === 'function') {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(place);
        }
    }

    const stop = options.editor.subscribe(sync);
    // The content scrolls under the handle, and a resize reflows the lines.
    const follow = () => sync();
    const listening = options.host();
    listening?.addEventListener('scroll', follow, { capture: true, passive: true });
    if (typeof window !== 'undefined') window.addEventListener('resize', follow);
    sync();

    return {
        sync,
        close: () => overlay.close(),
        destroy() {
            stop();
            if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame);
            listening?.removeEventListener('scroll', follow, { capture: true });
            if (typeof window !== 'undefined') window.removeEventListener('resize', follow);
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

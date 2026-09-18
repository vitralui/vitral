import type { EditorColor, EditorCommandArgs, EditorCommandName, EditorInstance, EditorKeyBinding, EditorState, EditorView, Locale } from '@vitral/core';
import { inject, type ComputedRef, type InjectionKey, type Ref, type ShallowRef } from 'vue';
import type { BaseProps, PassThrough } from '../../base/types';

/**
 * What `<EditorRoot>` shares with its parts — and, through `useEditor()`, with
 * an application building its own interface around the editor.
 */
export interface EditorContext {
    /** The framework-free editor: state, commands, history, formats. */
    editor: EditorInstance;
    /** The editor's state, as a reactive value: read it and a computed follows every change. */
    state: ShallowRef<EditorState>;
    view: ShallowRef<EditorView | null>;
    /** Neither read-only nor disabled. */
    editable: ComputedRef<boolean>;
    readonly: ComputedRef<boolean>;
    disabled: ComputedRef<boolean>;
    invalid: ComputedRef<boolean>;
    placeholder: ComputedRef<string | undefined>;
    maxLength: ComputedRef<number | undefined>;
    /** The colours the pickers offer. */
    colors: ComputedRef<readonly EditorColor[]>;
    locale: ComputedRef<Locale>;
    ids: { content: string; help: string };
    /** Ids the text is described by (the count registers itself). */
    describedBy: Ref<string[]>;
    /** Attributes given to the root that belong to the text (`aria-label`, `id`…). */
    contentAttrs: ComputedRef<Record<string, unknown>>;
    /** Whether the text has focus. */
    contentFocused: Ref<boolean>;
    /** The toolbar and floating toolbar, for Alt+F10. */
    toolbar: Ref<HTMLElement | null>;
    bubble: Ref<HTMLElement | null>;
    /** Pressing (and dragging a selection) in the text. */
    selecting: Ref<boolean>;
    /** Bumped when the floating toolbar should close until the selection changes. */
    bubbleDismissed: Ref<boolean>;
    /** How many popups a part has open (a colour grid, the link editor); the floating toolbar stays while there are any. */
    popups: Ref<number>;
    unstyled: () => boolean | undefined;
    pt: () => PassThrough | undefined;
    isActive(name: string, attrs?: Record<string, unknown>): boolean;
    can<K extends EditorCommandName>(name: K, ...args: EditorCommandArgs<K>): boolean;
    run<K extends EditorCommandName>(name: K, ...args: EditorCommandArgs<K>): boolean;
    /** Focuses the text, restoring its selection. */
    focus(): void;
    /** Moves focus to the toolbar (or the floating one); false when there is none. */
    focusToolbar(): boolean;
    /** Opens the link editor, anchored to `anchor` or to the selection. */
    openLink(anchor?: HTMLElement | null): void;
    /** Moves the invisible caret element to the selection and returns it, for anchoring popups. */
    caretAnchor(): HTMLElement | null;
    /** The shortcut bound to a command, formatted for a tooltip and for `aria-keyshortcuts`. */
    shortcut(command: string, args?: readonly unknown[]): { label: string; aria: string } | undefined;
    // Wiring between the parts.
    attachView(view: EditorView | null, element?: HTMLElement | null): void;
    handleKey(name: string, binding: EditorKeyBinding | undefined, event: KeyboardEvent): boolean;
    onContentFocus(event: FocusEvent): void;
    onContentBlur(event: FocusEvent): void;
    registerLinkPanel(open: ((anchor: HTMLElement | null) => void) | null): void;
}

export const EditorKey: InjectionKey<EditorContext> = Symbol('vt-editor');

export function useEditorContext(part: string): EditorContext {
    const ctx = inject(EditorKey, null);
    if (!ctx) throw new Error(`<${part}> must be placed inside <EditorRoot> (Editor.Root) or <Editor>.`);
    return ctx;
}

/**
 * A part's props, with `unstyled` falling back to the root's and the root's
 * pass-through applying under the part's own — so `<Editor :pt="{ toolbar: … }">`
 * reaches the toolbar the editor builds.
 */
export function inheritRoot<P extends BaseProps>(props: P, ctx: EditorContext): P {
    return new Proxy(props, {
        get(target, key) {
            if (key === 'unstyled') return target.unstyled ?? ctx.unstyled();
            if (key === 'pt') {
                const inherited = ctx.pt();
                return inherited ? { ...inherited, ...target.pt } : target.pt;
            }
            return Reflect.get(target, key);
        }
    });
}

import { inject, readonly } from 'vue';
import { EditorKey } from '../components/Editor/context';

/**
 * The editor of the nearest `<EditorRoot>` (or `<Editor>`), for building an
 * interface of your own around it: the reactive state, the commands, what is
 * active and what can run.
 *
 * ```ts
 * const { isActive, run } = useEditor();
 * const bold = computed(() => isActive('bold'));
 * run('toggleBold');
 * ```
 */
export function useEditor() {
    const ctx = inject(EditorKey, null);
    if (!ctx) throw new Error('useEditor() must be called in a component inside <EditorRoot> (Editor.Root) or <Editor>.');
    return {
        /** The framework-free editor. */
        editor: ctx.editor,
        /** Its state; reactive. */
        state: readonly(ctx.state),
        commands: ctx.editor.commands,
        run: ctx.run,
        can: ctx.can,
        isActive: ctx.isActive,
        editable: ctx.editable,
        focus: ctx.focus,
        openLink: ctx.openLink,
        characterCount: () => (void ctx.state.value, ctx.editor.characterCount()),
        wordCount: () => (void ctx.state.value, ctx.editor.wordCount())
    };
}

export type UseEditorReturn = ReturnType<typeof useEditor>;

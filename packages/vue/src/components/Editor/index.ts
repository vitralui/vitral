import EditorVue from './Editor.vue';
import EditorBlockSelect from './EditorBlockSelect.vue';
import EditorBubbleMenu from './EditorBubbleMenu.vue';
import EditorButton from './EditorButton.vue';
import EditorColorPicker from './EditorColorPicker.vue';
import EditorContent from './EditorContent.vue';
import EditorCount from './EditorCount.vue';
import EditorFooter from './EditorFooter.vue';
import EditorImageButton from './EditorImageButton.vue';
import EditorLinkPanel from './EditorLinkPanel.vue';
import EditorRoot from './EditorRoot.vue';
import EditorTableMenu from './EditorTableMenu.vue';
import EditorToolbar from './EditorToolbar.vue';
import EditorToolbarGroup from './EditorToolbarGroup.vue';

const parts = {
    Root: EditorRoot,
    Toolbar: EditorToolbar,
    ToolbarGroup: EditorToolbarGroup,
    Button: EditorButton,
    BlockSelect: EditorBlockSelect,
    ColorPicker: EditorColorPicker,
    ImageButton: EditorImageButton,
    TableMenu: EditorTableMenu,
    LinkPanel: EditorLinkPanel,
    Content: EditorContent,
    BubbleMenu: EditorBubbleMenu,
    Footer: EditorFooter,
    Count: EditorCount
};

function withParts<C extends object, P extends object>(component: C, extra: P): C & P {
    return Object.assign(component, extra);
}

/**
 * The ready-made editor and, as properties, the parts it is built from, so
 * a template can compose its own: `<Editor.Root>`, `<Editor.Toolbar>`,
 * `<Editor.Button command="bold">`, `<Editor.Content>`… Each part is also a
 * named export (`EditorRoot`, `EditorContent`…).
 */
export const Editor = /* @__PURE__ */ withParts(EditorVue, parts);

export {
    EditorRoot,
    EditorToolbar,
    EditorToolbarGroup,
    EditorButton,
    EditorBlockSelect,
    EditorColorPicker,
    EditorImageButton,
    EditorTableMenu,
    EditorLinkPanel,
    EditorContent,
    EditorBubbleMenu,
    EditorFooter,
    EditorCount
};
export { EditorKey, type EditorContext } from './context';
export { editorButtons, defaultToolbar as defaultEditorToolbar, defaultBubbleMenu as defaultEditorBubbleMenu } from './buttons';
export type * from './types';

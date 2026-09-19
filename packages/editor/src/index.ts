/**
 * `@vitral/editor`: a rich text editor with no framework in it. The document,
 * the commands and the history are `@vitral/core`'s; this package is the
 * interface around them — the toolbar, the panels, the floating toolbar over a
 * selection, the menu a `/` opens and the handle beside a block.
 */
export { createTextEditor } from './editor';
export { editorButtons, shortcutCommands, defaultToolbar, defaultBubbleMenu, type EditorButtonSpec } from './buttons';
export * from './types';
export { toolbarView, bubbleView, buttonView, iconView, type ToolbarActions, type ToolbarContext } from './render/toolbar';
export {
    blockHandleView,
    blockMenuView,
    colorPanelView,
    imagePanelView,
    linkPanelView,
    slashMenuView,
    tablePanelView,
    type LinkPanelActions,
    type LinkPanelState,
    type PanelContext,
    type SlashMenuState
} from './render/menus';

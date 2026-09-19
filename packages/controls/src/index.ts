/**
 * `@vitral/controls`: the controls an addon needs, with no framework in them.
 *
 * An addon draws its own markup, but a select, a menu and an anchored panel
 * are not markup — they are behaviour, and each was being written again in
 * every addon that needed one. These are written once, over `@vitral/core`'s
 * arithmetic and `@vitral/dom`'s patcher, and they wear the same styles the
 * framework components wear, so a page with no framework gets the control the
 * framework would have drawn.
 *
 * A framework component that already has a better control hands it to the
 * addon instead — that is what an addon's `content` hooks are for.
 */
export { createOverlay, type CloseReason, type Overlay, type OverlayOptions, type OverlayTarget } from './overlay';
export { createSelect, type SelectConfig, type SelectHandle, type SelectOption } from './select';
export { createMenu, type MenuConfig, type MenuHandle, type MenuItem } from './menu';
export { createTooltips, type Tooltips, type TooltipsOptions } from './tooltip';

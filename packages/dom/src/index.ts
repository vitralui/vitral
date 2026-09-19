/**
 * `@vitral/dom`: the little that a framework-free component needs to put
 * itself on a page, and nothing more.
 *
 * - `h` and `createRoot`: a keyed patcher, so a component describes its markup
 *   as plain objects on every change and only what differs reaches the
 *   document — an element that is kept keeps its focus and its animation;
 * - `partResolver` and `mergeAttrs`: the classes of one part in one state,
 *   with pass-through over them, which is how every Vitral component is
 *   dressed;
 * - `dragging`: a press that becomes a drag, the same for a mouse, a pen and
 *   a finger;
 * - `iconNode`: an icon in the SVG namespace, from a definition the caller
 *   looked up.
 *
 * The addons (`@vitral/chart`, `@vitral/datatable`, `@vitral/schedule`)
 * render with it; the framework components wrap those. Nothing here knows
 * about any framework.
 */
export * from './h';
export * from './attrs';
export * from './drag';
export * from './icon';

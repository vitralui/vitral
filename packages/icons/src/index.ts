/**
 * `@vitral/icons`: every icon is a named export, so an application bundles only
 * the ones it imports. The catalogue, every icon by name and by category, is in
 * the separate `@vitral/icons/registry` entry, which pulls in the whole set.
 */
export * from './icons/index';
export { iconCategories, type IconCategoryId } from './categories';
export { baseIcons, getIcon, registerIcons, renderSvg, type RenderSvgOptions } from './runtime';
export { isMirrored, mirroredIcons } from './direction';
export { ICON_STROKE_WIDTH, ICON_VIEWBOX, type IconDef } from './types';
export type { IconName } from './registry';

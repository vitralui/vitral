/**
 * `@vitral/icons`: every icon is a named export, so an application bundles only
 * the ones it imports. The catalogue — every icon by name and by category — is
 * the separate `@vitral/icons/registry` entry, which pulls in the whole set.
 */
export * from './icons/index';
export { iconCategories, type IconCategoryId } from './categories';
export { baseIcons, getIcon, registerIcons, renderSvg } from './runtime';
export { ICON_STROKE_WIDTH, ICON_VIEWBOX, type IconDef } from './types';
export type { IconName } from './registry';

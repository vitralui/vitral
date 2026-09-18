/**
 * `@vitral/icons/registry`: the whole set, by name and by category, for an
 * icon picker, a catalogue page or an app that wants every name to resolve.
 * Importing this module bundles every icon; import icons by name otherwise.
 */
import { iconCategories, type IconCategoryId } from './categories';
import { icons, sets } from './icons/all';
import { registerIcons } from './runtime';
import type { IconDef } from './types';

export { icons };

export type IconName = keyof typeof icons;

/** Every icon, in catalogue order. */
export const iconList: readonly IconDef[] = iconCategories.flatMap((category) => Object.values(sets[category.id]) as IconDef[]);

export interface IconCategory {
    id: IconCategoryId;
    label: string;
    icons: readonly IconDef[];
}

/** The set grouped for display, in catalogue order. */
export const categories: readonly IconCategory[] = iconCategories.map((category) => ({
    id: category.id,
    label: category.label,
    icons: Object.values(sets[category.id]) as IconDef[]
}));

/** Makes every built-in name resolve in `<Icon icon="…">` and `getIcon()`. */
export function registerAllIcons(): void {
    registerIcons(iconList);
}

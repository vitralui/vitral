import { t } from './lib/i18n';

/**
 * Every page in `src/demos/` exports one of these from a plain `<script>`
 * block; the catalog discovers the pages by glob, so adding a demo is adding a
 * file.
 *
 * Its translations are in `locales/<lang>/components/<id>.json`, not here:
 * the template is also the code shown beside each example, and stays as it is.
 */
export interface DemoMeta {
    title: string;
    category: 'Form' | 'Button' | 'Data' | 'Panel' | 'Overlay' | 'Menu' | 'Messages' | 'Media' | 'Layout' | 'Misc';
    description?: string;
}

export const categoryOrder: DemoMeta['category'][] = ['Form', 'Button', 'Data', 'Panel', 'Overlay', 'Menu', 'Messages', 'Media', 'Layout', 'Misc'];

/** A category's name as the page's language reads it; the English one stays the key. */
export function categoryName(category: DemoMeta['category']): string {
    return t(category);
}

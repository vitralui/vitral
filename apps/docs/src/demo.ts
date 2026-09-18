/**
 * Every page in `src/demos/` exports one of these from a plain `<script>`
 * block; the catalog discovers the pages by glob, so adding a demo is adding a
 * file.
 */
export interface DemoMeta {
    title: string;
    category: 'Form' | 'Button' | 'Data' | 'Panel' | 'Overlay' | 'Menu' | 'Messages' | 'Media' | 'Layout' | 'Misc';
    description?: string;
}

export const categoryOrder: DemoMeta['category'][] = ['Form', 'Button', 'Data', 'Panel', 'Overlay', 'Menu', 'Messages', 'Media', 'Layout', 'Misc'];

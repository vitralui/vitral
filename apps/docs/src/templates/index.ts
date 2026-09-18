import { templateCategoryOrder, type TemplateMeta } from './types';
import './templates.css';

export type { TemplateCategory, TemplateMeta, TemplateScreen } from './types';

/**
 * Every folder here with an `index.ts` is a template; the site finds them by
 * glob, the same way it finds the component demos. The order is the gallery's.
 */
const order = ['ecommerce', 'saas', 'news', 'blog', 'realestate', 'airline', 'lms', 'finance', 'projects'];

// Only the metadata is loaded up front; a template's layout and screens are
// async components, so their code is fetched when a preview first shows them.
const modules = import.meta.glob<{ template: TemplateMeta }>('./*/index.ts', { eager: true });

export const templates: TemplateMeta[] = Object.values(modules)
    .map((module) => module.template)
    .sort((a, b) => (order.indexOf(a.id) + 1 || 99) - (order.indexOf(b.id) + 1 || 99));

export const templateCategories = templateCategoryOrder
    .map((category) => ({ category, items: templates.filter((entry) => entry.category === category) }))
    .filter((group) => group.items.length > 0);

export function templateOf(id: string) {
    return templates.find((entry) => entry.id === id);
}

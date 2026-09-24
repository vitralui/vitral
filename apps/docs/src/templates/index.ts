import { catalog, t } from '../lib/i18n';
import { templateCategoryOrder, type TemplateMeta, type TemplateScreen } from './types';
import './templates.css';

export type { TemplateCategory, TemplateMeta, TemplateScreen } from './types';

/**
 * Every folder here with an `index.ts` is a template; the site finds them by
 * glob, the same way it finds the component demos. The order is the gallery's.
 */
const order = ['ecommerce', 'saas', 'news', 'blog', 'realestate', 'airline', 'lms', 'finance', 'projects', 'auth'];

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

/**
 * What a template's page says about it, in the page's language, from
 * `locales/<lang>/templates/<id>.json`. The name is the product's and stays;
 * the lists are translated whole or not at all, so a page never mixes them.
 *
 *     { "summary": "…", "description": "…", "tags": [], "features": [], "faq": [{ "question": "…", "answer": "…" }],
 *       "screens": { "overview": { "name": "…", "summary": "…" } } }
 */
export function templateText(entry: TemplateMeta) {
    const text = catalog(`templates/${entry.id}`) as
        | Partial<Pick<TemplateMeta, 'summary' | 'description' | 'tags' | 'features' | 'faq'>> & { screens?: Record<string, { name?: string; summary?: string }> }
        | undefined;
    return {
        category: t(entry.category),
        summary: text?.summary ?? entry.summary,
        description: text?.description ?? entry.description,
        tags: text?.tags ?? entry.tags,
        features: text?.features ?? entry.features,
        faq: text?.faq ?? entry.faq,
        screen: (screen: TemplateScreen) => ({ name: text?.screens?.[screen.id]?.name ?? screen.name, summary: text?.screens?.[screen.id]?.summary ?? screen.summary })
    };
}

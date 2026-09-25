import { lazyComponent, type LazyComponent } from './lazy';
import type { Route } from './router';

/**
 * The pages that are one of a kind, each fetched when it is first opened: the
 * landing page brings the chart engine for its hero, the icon page the whole
 * icon set, and a reader of the docs needs neither. The component and guide
 * pages are the shell every demo and guide is drawn in, and stay in the first
 * chunk.
 */
export const pages: Partial<Record<Route['name'], LazyComponent>> = {
    home: lazyComponent(() => import('../pages/Home.vue')),
    components: lazyComponent(() => import('../pages/ComponentsPage.vue')),
    templates: lazyComponent(() => import('../pages/TemplatesPage.vue')),
    template: lazyComponent(() => import('../pages/TemplatePage.vue')),
    'template-preview': lazyComponent(() => import('../pages/TemplateFullscreen.vue')),
    icons: lazyComponent(() => import('../pages/IconsPage.vue')),
    charts: lazyComponent(() => import('../pages/ChartsPage.vue'))
};

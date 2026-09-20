import type { IconDef } from '@vitral/icons';
import type { Component } from 'vue';

/**
 * A template is a small application made only of Vitral components: a layout
 * that owns its own navigation, and one component per screen. Everything a
 * page about it says (what it holds, which components it uses, the questions
 * people ask) lives here, next to the code, so the gallery never drifts from
 * what it shows.
 */
export type TemplateCategory = 'Commerce' | 'Publishing' | 'Dashboard' | 'Travel' | 'Education' | 'Productivity' | 'Authentication';

export const templateCategoryOrder: TemplateCategory[] = ['Commerce', 'Publishing', 'Dashboard', 'Travel', 'Education', 'Productivity', 'Authentication'];

export interface TemplateScreen {
    id: string;
    name: string;
    /** One line: what the screen is for. */
    summary: string;
    component: Component;
}

export interface TemplateMeta {
    id: string;
    name: string;
    category: TemplateCategory;
    icon: IconDef;
    /** One line for the card. */
    summary: string;
    /** The longer pitch, on the template's own page. */
    description: string;
    tags: string[];
    features: string[];
    faq: { question: string; answer: string }[];
    /** Component names as the catalog titles them (`DataGrid`, `Galleria`). */
    components: string[];
    /** The root: renders the chrome and the current screen. */
    layout: Component;
    screens: TemplateScreen[];
}

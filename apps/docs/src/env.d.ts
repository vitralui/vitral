// Served by `scripts/changes.ts`.
declare module 'virtual:vitral-changes' {
    import type { ComponentChange } from '../../../scripts/changes';

    /** The version of the packages the site is built from. */
    export const version: string;
    /** What the last few releases added and changed, by component folder (`Button`). */
    export const components: Record<string, ComponentChange>;
}

declare module 'virtual:vitral-releases' {
    import type { Release } from '../../../scripts/changes';

    /** Every release, newest first, with what it added and changed. */
    export const releases: Release[];
}

// Served by `scripts/sfc-meta.ts`.
declare module 'virtual:vitral-section-titles' {
    /** The title of each example in each language: language, page id (`datagrid`), English title. */
    export const titles: Record<string, Record<string, Record<string, string>>>;
}

// Served by `scripts/changes.ts`.
declare module 'virtual:vitral-changes' {
    import type { ComponentChange } from '../../../scripts/changes';

    /** The version of the packages the site is built from. */
    export const version: string;
    /** What the last few releases added and changed, by component folder (`Button`). */
    export const components: Record<string, ComponentChange>;
}

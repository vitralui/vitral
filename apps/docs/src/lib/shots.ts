/**
 * Where a template screen's picture is: taken by `scripts/shoot-templates.mjs`
 * from the running template, in the default preset, in both schemes, and served
 * from `public/`. Rerun the script after changing a template.
 */
export const SHOT_WIDTH = 1440;
export const SHOT_HEIGHT = 900;

export function shotOf(template: string, screen: string, dark: boolean): string {
    return `${import.meta.env.BASE_URL}templates/${template}/${screen}-${dark ? 'dark' : 'light'}.webp`;
}

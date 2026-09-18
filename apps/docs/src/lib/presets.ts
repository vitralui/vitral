import { Avalonia, Ink, Prism, Simple, type Preset } from '@vitral/vue';

/**
 * The presets the site ships with, as the theme menu, the home page's
 * appearance card, the presets guide and the template previews offer them.
 */
export interface ThemeEntry {
    id: string;
    name: string;
    origin: string;
    /** The pitch, in the presets guide. */
    description: string;
    /** What the theme changes, in the reader's terms. */
    traits: string[];
    preset: Preset;
}

export const themes: ThemeEntry[] = [
    {
        id: 'prism',
        name: 'Prism',
        origin: 'web native',
        description:
            'The web-native look: a blue primary, 6px corners, a soft focus halo and a shadow under every overlay. It is the preset every other one is a diff against, and the one the component tokens are drawn for first.',
        traits: ['Blue primary', '6px corners', 'Soft shadows', 'Halo focus ring'],
        preset: Prism
    },
    {
        id: 'ink',
        name: 'Ink',
        origin: 'quiet ink on paper',
        description:
            'Colour reserved for meaning: the primary button is ink on white and paper on black, the borders are hairlines, and the only shadow is the one under a popover. The focus ring sits two pixels off the control with the page colour between them.',
        traits: ['Ink primary', 'Hairline borders', 'Offset focus ring', 'One shadow, used sparingly'],
        preset: Ink
    },
    {
        id: 'avalonia',
        name: 'Avalonia',
        origin: 'desktop accent blue',
        description:
            'The desktop look: a #0078d4 accent, control fills that let the window through, a two-pixel accent line under a focused text box, a two-tone focus ring and an accent pill on the selected row of a list.',
        traits: ['Accent blue', 'Translucent fills', 'Accent line on focus', 'Selection pill'],
        preset: Avalonia
    },
    {
        id: 'simple',
        name: 'Simple',
        origin: 'dense tooling',
        description:
            'For the screens that are read all day: square corners, grey control fills with a mid-grey border, a compact 13px type size, and transitions turned off entirely so nothing moves while you work.',
        traits: ['Square corners', '13px type', 'No shadows', 'No animation'],
        preset: Simple
    }
];

export function themeOf(id: string) {
    return themes.find((theme) => theme.id === id);
}

import type { TokenTree } from '../../engine/types';

/**
 * The fills, borders and text colours one severity needs across every
 * component: a solid fill (buttons, badges), a subtle tint (messages, tags,
 * text buttons on hover), and the colours that sit on each.
 *
 * `shade` is the palette step the solid fill uses in light mode. It is 700 for
 * green and sky rather than 600, because white text on their 600 falls short of
 * the 4.5:1 contrast WCAG asks for.
 */
export function severityLight(palette: string, shade = 600, contrast = '#ffffff'): TokenTree {
    const s = (offset: number) => `{${palette}.${Math.min(950, shade + offset)}}`;
    return {
        color: s(0),
        contrastColor: contrast,
        hoverColor: s(100),
        activeColor: s(200),
        borderColor: s(0),
        hoverBorderColor: s(100),
        subtleBackground: `{${palette}.50}`,
        subtleHoverBackground: `{${palette}.100}`,
        subtleColor: `{${palette}.${Math.max(700, shade)}}`,
        subtleBorderColor: `{${palette}.200}`
    };
}

export function severityDark(palette: string): TokenTree {
    return {
        color: `{${palette}.400}`,
        contrastColor: '{surface.950}',
        hoverColor: `{${palette}.300}`,
        activeColor: `{${palette}.200}`,
        borderColor: `{${palette}.400}`,
        hoverBorderColor: `{${palette}.300}`,
        subtleBackground: `color-mix(in srgb, {${palette}.500} 16%, transparent)`,
        subtleHoverBackground: `color-mix(in srgb, {${palette}.500} 26%, transparent)`,
        subtleColor: `{${palette}.300}`,
        subtleBorderColor: `color-mix(in srgb, {${palette}.500} 36%, transparent)`
    };
}

const surface = {
    0: '#ffffff',
    50: '{zinc.50}',
    100: '{zinc.100}',
    200: '{zinc.200}',
    300: '{zinc.300}',
    400: '{zinc.400}',
    500: '{zinc.500}',
    600: '{zinc.600}',
    700: '{zinc.700}',
    800: '{zinc.800}',
    900: '{zinc.900}',
    950: '{zinc.950}'
};

/**
 * The semantic layer every component reads. Presets override pieces of it;
 * the component layer refers to it by name and never to a raw colour.
 */
export const semantic: TokenTree = {
    fontFamily: "Inter, 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', sans-serif",
    fontFamilyMono: "'JetBrains Mono', 'SF Mono', Consolas, 'Liberation Mono', monospace",
    fontSize: '0.875rem',
    lineHeight: '1.5',
    transitionDuration: '0.15s',
    disabledOpacity: '0.55',
    /**
     * `<Icon>`: the box every icon is drawn in unless a component sizes it, and
     * its stroke in units of the 24×24 drawing grid (2 is the drawn weight).
     */
    icon: { size: '1rem', strokeWidth: '2' },

    /**
     * The small icon-only buttons that close, remove or clear something: a
     * tag's ×, a dialog's close, a field's clear. One shape everywhere, so a
     * theme changes them together.
     */
    iconButton: { borderRadius: '{borderRadius.pill}' },
    anchorGutter: '4px',

    focusRing: { width: '2px', style: 'solid', color: '{primary.color}', offset: '2px' },

    primary: {
        50: '{blue.50}',
        100: '{blue.100}',
        200: '{blue.200}',
        300: '{blue.300}',
        400: '{blue.400}',
        500: '{blue.500}',
        600: '{blue.600}',
        700: '{blue.700}',
        800: '{blue.800}',
        900: '{blue.900}',
        950: '{blue.950}'
    },

    /** Controls are sized by minimum height, the way a desktop control set is. */
    control: {
        minHeight: '2.25rem',
        sm: { minHeight: '1.875rem' },
        lg: { minHeight: '2.75rem' }
    },

    formField: {
        paddingX: '0.75rem',
        paddingY: '0.5rem',
        borderWidth: '1px',
        borderRadius: '{borderRadius.md}',
        transitionDuration: '{transitionDuration}',
        sm: { fontSize: '0.8125rem', paddingX: '0.625rem', paddingY: '0.3125rem' },
        lg: { fontSize: '1rem', paddingX: '0.875rem', paddingY: '0.625rem' }
    },

    list: {
        padding: '0.25rem',
        gap: '2px',
        header: { padding: '0.5rem 0.5rem 0.25rem' },
        option: { padding: '0.5rem 0.75rem', borderRadius: '{borderRadius.sm}' },
        optionGroup: { padding: '0.5rem 0.75rem', fontWeight: '600' }
    },

    content: { borderRadius: '{borderRadius.md}' },

    overlay: {
        select: { borderRadius: '{borderRadius.md}', shadow: '0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -2px rgba(0, 0, 0, 0.08)' },
        popover: { borderRadius: '{borderRadius.md}', padding: '0.75rem', shadow: '0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -2px rgba(0, 0, 0, 0.08)' },
        modal: { borderRadius: '{borderRadius.xl}', padding: '1.25rem', shadow: '0 20px 40px -8px rgba(0, 0, 0, 0.25)' },
        navigation: { shadow: '0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -2px rgba(0, 0, 0, 0.08)' }
    },

    navigation: {
        list: { padding: '0.25rem', gap: '2px' },
        item: { padding: '0.5rem 0.75rem', borderRadius: '{borderRadius.sm}', gap: '0.5rem' },
        submenuLabel: { padding: '0.5rem 0.75rem', fontWeight: '600' },
        submenuIcon: { size: '0.875rem' }
    },

    chart: {
        1: '{blue.500}',
        2: '{pink.500}',
        3: '{emerald.500}',
        4: '{teal.500}',
        5: '{amber.500}',
        6: '{red.500}',
        7: '{violet.500}',
        8: '{slate.500}'
    },

    colorScheme: {
        light: {
            surface,
            primary: { ...severityLight('primary'), subtleColor: '{primary.700}' },
            highlight: { background: '{primary.50}', focusBackground: '{primary.100}', color: '{primary.700}', focusColor: '{primary.800}' },
            mask: { background: 'rgba(0, 0, 0, 0.4)', color: '{surface.200}' },
            app: { background: '{surface.50}' },
            formField: {
                background: '{surface.0}',
                hoverBackground: '{surface.0}',
                focusBackground: '{surface.0}',
                disabledBackground: '{surface.100}',
                filledBackground: '{surface.100}',
                filledHoverBackground: '{surface.100}',
                filledFocusBackground: '{surface.0}',
                borderColor: '{surface.300}',
                hoverBorderColor: '{surface.400}',
                focusBorderColor: '{primary.color}',
                invalidBorderColor: '{danger.color}',
                color: '{surface.900}',
                disabledColor: '{surface.500}',
                placeholderColor: '{surface.500}',
                invalidPlaceholderColor: '{danger.color}',
                iconColor: '{surface.500}',
                shadow: '0 1px 2px 0 rgba(18, 18, 23, 0.05)',
                focusShadow: '0 0 0 3px color-mix(in srgb, {primary.color} 20%, transparent)'
            },
            text: { color: '{surface.900}', hoverColor: '{surface.950}', mutedColor: '{surface.500}', hoverMutedColor: '{surface.700}' },
            content: { background: '{surface.0}', hoverBackground: '{surface.100}', borderColor: '{surface.200}', color: '{text.color}', hoverColor: '{text.hoverColor}' },
            overlay: {
                select: { background: '{surface.0}', borderColor: '{surface.200}', color: '{text.color}' },
                popover: { background: '{surface.0}', borderColor: '{surface.200}', color: '{text.color}' },
                modal: { background: '{surface.0}', borderColor: '{surface.200}', color: '{text.color}' }
            },
            list: {
                option: {
                    focusBackground: '{surface.100}',
                    selectedBackground: '{highlight.background}',
                    selectedFocusBackground: '{highlight.focusBackground}',
                    color: '{text.color}',
                    focusColor: '{text.hoverColor}',
                    selectedColor: '{highlight.color}',
                    selectedFocusColor: '{highlight.focusColor}',
                    selectedIndicator: 'transparent',
                    icon: { color: '{surface.400}', focusColor: '{surface.500}' }
                },
                optionGroup: { background: 'transparent', color: '{text.mutedColor}' }
            },
            navigation: {
                item: {
                    focusBackground: '{surface.100}',
                    activeBackground: '{surface.100}',
                    color: '{text.color}',
                    focusColor: '{text.hoverColor}',
                    activeColor: '{text.hoverColor}',
                    activeIndicator: 'transparent',
                    icon: { color: '{surface.400}', focusColor: '{surface.500}', activeColor: '{surface.500}' }
                },
                submenuLabel: { background: 'transparent', color: '{text.mutedColor}' },
                submenuIcon: { color: '{surface.400}', focusColor: '{surface.500}', activeColor: '{surface.500}' }
            },
            secondary: {
                color: '{surface.100}',
                contrastColor: '{surface.800}',
                hoverColor: '{surface.200}',
                activeColor: '{surface.300}',
                borderColor: '{surface.100}',
                hoverBorderColor: '{surface.200}',
                subtleBackground: '{surface.100}',
                subtleHoverBackground: '{surface.200}',
                subtleColor: '{surface.700}',
                subtleBorderColor: '{surface.200}'
            },
            success: severityLight('green', 700),
            info: severityLight('sky', 700),
            warn: { ...severityLight('amber', 400, '{amber.950}'), subtleColor: '{amber.800}' },
            danger: severityLight('red'),
            help: severityLight('violet'),
            contrast: {
                color: '{surface.950}',
                contrastColor: '{surface.0}',
                hoverColor: '{surface.800}',
                activeColor: '{surface.700}',
                borderColor: '{surface.950}',
                hoverBorderColor: '{surface.800}',
                subtleBackground: '{surface.100}',
                subtleHoverBackground: '{surface.200}',
                subtleColor: '{surface.950}',
                subtleBorderColor: '{surface.300}'
            }
        },
        dark: {
            surface,
            primary: severityDark('primary'),
            highlight: {
                background: 'color-mix(in srgb, {primary.400} 16%, transparent)',
                focusBackground: 'color-mix(in srgb, {primary.400} 24%, transparent)',
                color: 'rgba(255, 255, 255, 0.87)',
                focusColor: 'rgba(255, 255, 255, 0.87)'
            },
            mask: { background: 'rgba(0, 0, 0, 0.6)', color: '{surface.200}' },
            app: { background: '{surface.950}' },
            formField: {
                background: '{surface.950}',
                hoverBackground: '{surface.950}',
                focusBackground: '{surface.950}',
                disabledBackground: '{surface.800}',
                filledBackground: '{surface.800}',
                filledHoverBackground: '{surface.800}',
                filledFocusBackground: '{surface.800}',
                borderColor: '{surface.600}',
                hoverBorderColor: '{surface.500}',
                focusBorderColor: '{primary.color}',
                invalidBorderColor: '{danger.color}',
                color: '{surface.0}',
                disabledColor: '{surface.400}',
                placeholderColor: '{surface.400}',
                invalidPlaceholderColor: '{danger.color}',
                iconColor: '{surface.400}',
                shadow: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
                focusShadow: '0 0 0 3px color-mix(in srgb, {primary.color} 25%, transparent)'
            },
            text: { color: '{surface.0}', hoverColor: '{surface.0}', mutedColor: '{surface.400}', hoverMutedColor: '{surface.300}' },
            content: { background: '{surface.900}', hoverBackground: '{surface.800}', borderColor: '{surface.700}', color: '{text.color}', hoverColor: '{text.hoverColor}' },
            overlay: {
                select: { background: '{surface.900}', borderColor: '{surface.700}', color: '{text.color}' },
                popover: { background: '{surface.900}', borderColor: '{surface.700}', color: '{text.color}' },
                modal: { background: '{surface.900}', borderColor: '{surface.700}', color: '{text.color}' }
            },
            list: {
                option: {
                    focusBackground: '{surface.800}',
                    selectedBackground: '{highlight.background}',
                    selectedFocusBackground: '{highlight.focusBackground}',
                    color: '{text.color}',
                    focusColor: '{text.hoverColor}',
                    selectedColor: '{highlight.color}',
                    selectedFocusColor: '{highlight.focusColor}',
                    selectedIndicator: 'transparent',
                    icon: { color: '{surface.500}', focusColor: '{surface.400}' }
                },
                optionGroup: { background: 'transparent', color: '{text.mutedColor}' }
            },
            navigation: {
                item: {
                    focusBackground: '{surface.800}',
                    activeBackground: '{surface.800}',
                    color: '{text.color}',
                    focusColor: '{text.hoverColor}',
                    activeColor: '{text.hoverColor}',
                    activeIndicator: 'transparent',
                    icon: { color: '{surface.500}', focusColor: '{surface.400}', activeColor: '{surface.400}' }
                },
                submenuLabel: { background: 'transparent', color: '{text.mutedColor}' },
                submenuIcon: { color: '{surface.500}', focusColor: '{surface.400}', activeColor: '{surface.400}' }
            },
            secondary: {
                color: '{surface.800}',
                contrastColor: '{surface.0}',
                hoverColor: '{surface.700}',
                activeColor: '{surface.600}',
                borderColor: '{surface.800}',
                hoverBorderColor: '{surface.700}',
                subtleBackground: '{surface.800}',
                subtleHoverBackground: '{surface.700}',
                subtleColor: '{surface.300}',
                subtleBorderColor: '{surface.700}'
            },
            success: severityDark('green'),
            info: severityDark('sky'),
            warn: severityDark('amber'),
            danger: severityDark('red'),
            help: severityDark('violet'),
            contrast: {
                color: '{surface.0}',
                contrastColor: '{surface.950}',
                hoverColor: '{surface.100}',
                activeColor: '{surface.200}',
                borderColor: '{surface.0}',
                hoverBorderColor: '{surface.100}',
                subtleBackground: '{surface.800}',
                subtleHoverBackground: '{surface.700}',
                subtleColor: '{surface.0}',
                subtleBorderColor: '{surface.600}'
            }
        }
    }
};

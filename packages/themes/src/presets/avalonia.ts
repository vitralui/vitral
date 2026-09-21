import { definePreset } from '../engine/preset';
import { palette } from '../engine/palette';
import { Base } from './base';

// Values from the WinUI 3 / Avalonia FluentTheme resources: control fills are
// translucent over a Mica-like window, text boxes carry a darker bottom stroke
// that becomes a 2px accent line on focus, keyboard focus is a two-tone ring in
// the text colour, and selected list items show a small accent pill.

const neutral = {
    0: '#ffffff',
    50: '#f9f9f9',
    100: '#f3f3f3',
    200: '#ebebeb',
    300: '#e0e0e0',
    400: '#c4c4c4',
    500: '#8a8a8a',
    600: '#5d5d5d',
    700: '#3d3d3d',
    800: '#2c2c2c',
    900: '#202020',
    950: '#1a1a1a'
};

export const Avalonia = definePreset(Base, {
    primitive: {
        borderRadius: { none: '0', xs: '2px', sm: '4px', md: '4px', lg: '8px', xl: '8px', pill: '999px' },
        accent: palette('#0078d4')
    },
    semantic: {
        fontFamily: "'Segoe UI Variable Text', 'Segoe UI', 'Inter', system-ui, -apple-system, sans-serif",
        fontSize: '0.875rem',
        lineHeight: '1.43',
        transitionDuration: '0.083s',
        disabledOpacity: '0.45',
        primary: palette('{accent}'),
        control: { minHeight: '2rem', sm: { minHeight: '1.5rem' }, lg: { minHeight: '2.5rem' } },
        formField: {
            paddingX: '0.6875rem',
            paddingY: '0.3125rem',
            borderRadius: '{borderRadius.sm}',
            sm: { fontSize: '0.75rem', paddingX: '0.5rem', paddingY: '0.125rem' },
            lg: { fontSize: '1rem', paddingX: '0.75rem', paddingY: '0.5rem' }
        },
        focusRing: { width: '2px', style: 'solid', color: '{text.color}', offset: '1px' },
        list: {
            padding: '0.25rem',
            gap: '2px',
            option: { padding: '0.375rem 0.75rem', borderRadius: '{borderRadius.sm}' }
        },
        overlay: {
            select: { borderRadius: '{borderRadius.lg}', shadow: '0 8px 16px rgba(0, 0, 0, 0.14)' },
            popover: { borderRadius: '{borderRadius.lg}', padding: '1rem', shadow: '0 8px 16px rgba(0, 0, 0, 0.14)' },
            modal: { borderRadius: '{borderRadius.lg}', padding: '1.5rem', shadow: '0 32px 64px rgba(0, 0, 0, 0.19), 0 2px 21px rgba(0, 0, 0, 0.15)' },
            navigation: { shadow: '0 8px 16px rgba(0, 0, 0, 0.14)' }
        },
        navigation: { item: { padding: '0.4375rem 0.75rem' } },
        colorScheme: {
            light: {
                surface: neutral,
                app: { background: '#f3f3f3' },
                primary: {
                    color: '#005fb8',
                    contrastColor: '#ffffff',
                    hoverColor: 'rgba(0, 95, 184, 0.9)',
                    activeColor: 'rgba(0, 95, 184, 0.8)',
                    borderColor: '#005fb8',
                    hoverBorderColor: 'rgba(0, 95, 184, 0.9)',
                    subtleColor: '#005fb8'
                },
                highlight: { background: 'rgba(0, 0, 0, 0.037)', focusBackground: 'rgba(0, 0, 0, 0.056)', color: 'rgba(0, 0, 0, 0.894)', focusColor: 'rgba(0, 0, 0, 0.894)' },
                text: { color: 'rgba(0, 0, 0, 0.894)', hoverColor: '#000000', mutedColor: 'rgba(0, 0, 0, 0.62)', hoverMutedColor: 'rgba(0, 0, 0, 0.894)' },
                content: { background: 'rgba(255, 255, 255, 0.7)', hoverBackground: 'rgba(0, 0, 0, 0.037)', borderColor: 'rgba(0, 0, 0, 0.26)' },
                formField: {
                    background: 'rgba(255, 255, 255, 0.7)',
                    hoverBackground: 'rgba(249, 249, 249, 0.5)',
                    focusBackground: '#ffffff',
                    disabledBackground: 'rgba(249, 249, 249, 0.3)',
                    filledBackground: 'rgba(0, 0, 0, 0.024)',
                    filledHoverBackground: 'rgba(0, 0, 0, 0.037)',
                    filledFocusBackground: '#ffffff',
                    borderColor: 'rgba(0, 0, 0, 0.45)',
                    hoverBorderColor: 'rgba(0, 0, 0, 0.0578)',
                    focusBorderColor: 'rgba(0, 0, 0, 0.0578)',
                    color: 'rgba(0, 0, 0, 0.894)',
                    disabledColor: 'rgba(0, 0, 0, 0.36)',
                    placeholderColor: 'rgba(0, 0, 0, 0.62)',
                    iconColor: 'rgba(0, 0, 0, 0.62)',
                    shadow: 'inset 0 -1px 0 0 rgba(0, 0, 0, 0.45)',
                    focusShadow: 'inset 0 -2px 0 0 {primary.color}'
                },
                overlay: {
                    select: { background: '#f9f9f9', borderColor: 'rgba(0, 0, 0, 0.26)' },
                    popover: { background: '#f9f9f9', borderColor: 'rgba(0, 0, 0, 0.26)' },
                    modal: { background: '#ffffff', borderColor: 'rgba(0, 0, 0, 0.26)' }
                },
                list: {
                    option: {
                        focusBackground: 'rgba(0, 0, 0, 0.037)',
                        selectedBackground: 'rgba(0, 0, 0, 0.037)',
                        selectedFocusBackground: 'rgba(0, 0, 0, 0.056)',
                        selectedColor: 'rgba(0, 0, 0, 0.894)',
                        selectedFocusColor: 'rgba(0, 0, 0, 0.894)',
                        selectedIndicator: '{primary.color}'
                    }
                },
                navigation: {
                    item: { focusBackground: 'rgba(0, 0, 0, 0.037)', activeBackground: 'rgba(0, 0, 0, 0.037)', activeIndicator: '{primary.color}' }
                },
                secondary: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    contrastColor: 'rgba(0, 0, 0, 0.894)',
                    hoverColor: 'rgba(249, 249, 249, 0.5)',
                    activeColor: 'rgba(249, 249, 249, 0.3)',
                    borderColor: 'rgba(0, 0, 0, 0.0578)',
                    hoverBorderColor: 'rgba(0, 0, 0, 0.0578)',
                    subtleBackground: 'rgba(0, 0, 0, 0.037)',
                    subtleHoverBackground: 'rgba(0, 0, 0, 0.056)',
                    subtleColor: 'rgba(0, 0, 0, 0.894)',
                    subtleBorderColor: 'rgba(0, 0, 0, 0.0578)'
                }
            },
            dark: {
                surface: neutral,
                app: { background: '#202020' },
                primary: {
                    color: '#60cdff',
                    contrastColor: '#000000',
                    hoverColor: 'rgba(96, 205, 255, 0.9)',
                    activeColor: 'rgba(96, 205, 255, 0.8)',
                    borderColor: '#60cdff',
                    hoverBorderColor: 'rgba(96, 205, 255, 0.9)',
                    subtleColor: '#60cdff'
                },
                highlight: { background: 'rgba(255, 255, 255, 0.061)', focusBackground: 'rgba(255, 255, 255, 0.084)', color: '#ffffff', focusColor: '#ffffff' },
                text: { color: '#ffffff', hoverColor: '#ffffff', mutedColor: 'rgba(255, 255, 255, 0.786)', hoverMutedColor: '#ffffff' },
                content: { background: 'rgba(255, 255, 255, 0.051)', hoverBackground: 'rgba(255, 255, 255, 0.061)', borderColor: 'rgba(255, 255, 255, 0.17)' },
                formField: {
                    background: 'rgba(255, 255, 255, 0.061)',
                    hoverBackground: 'rgba(255, 255, 255, 0.084)',
                    focusBackground: '#1f1f1f',
                    disabledBackground: 'rgba(255, 255, 255, 0.042)',
                    filledBackground: 'rgba(255, 255, 255, 0.042)',
                    filledHoverBackground: 'rgba(255, 255, 255, 0.061)',
                    filledFocusBackground: '#1f1f1f',
                    borderColor: 'rgba(255, 255, 255, 0.36)',
                    hoverBorderColor: 'rgba(255, 255, 255, 0.0698)',
                    focusBorderColor: 'rgba(255, 255, 255, 0.0698)',
                    color: '#ffffff',
                    disabledColor: 'rgba(255, 255, 255, 0.363)',
                    placeholderColor: 'rgba(255, 255, 255, 0.786)',
                    iconColor: 'rgba(255, 255, 255, 0.786)',
                    shadow: 'inset 0 -1px 0 0 rgba(255, 255, 255, 0.54)',
                    focusShadow: 'inset 0 -2px 0 0 {primary.color}'
                },
                overlay: {
                    // Black over a dark panel is not an edge; in this scheme the
                    // light that separates things comes from above, not below.
                    select: { background: '#2c2c2c', borderColor: 'rgba(255, 255, 255, 0.17)' },
                    popover: { background: '#2c2c2c', borderColor: 'rgba(255, 255, 255, 0.17)' },
                    modal: { background: '#2b2b2b', borderColor: 'rgba(255, 255, 255, 0.17)' }
                },
                list: {
                    option: {
                        focusBackground: 'rgba(255, 255, 255, 0.061)',
                        selectedBackground: 'rgba(255, 255, 255, 0.061)',
                        selectedFocusBackground: 'rgba(255, 255, 255, 0.084)',
                        selectedColor: '#ffffff',
                        selectedFocusColor: '#ffffff',
                        selectedIndicator: '{primary.color}'
                    }
                },
                navigation: {
                    item: { focusBackground: 'rgba(255, 255, 255, 0.061)', activeBackground: 'rgba(255, 255, 255, 0.061)', activeIndicator: '{primary.color}' }
                },
                secondary: {
                    color: 'rgba(255, 255, 255, 0.061)',
                    contrastColor: '#ffffff',
                    hoverColor: 'rgba(255, 255, 255, 0.084)',
                    activeColor: 'rgba(255, 255, 255, 0.033)',
                    borderColor: 'rgba(255, 255, 255, 0.0698)',
                    hoverBorderColor: 'rgba(255, 255, 255, 0.0698)',
                    subtleBackground: 'rgba(255, 255, 255, 0.061)',
                    subtleHoverBackground: 'rgba(255, 255, 255, 0.084)',
                    subtleColor: '#ffffff',
                    subtleBorderColor: 'rgba(255, 255, 255, 0.0698)'
                }
            }
        }
    },
    components: {
        button: {
            root: { fontWeight: '400' },
            colorScheme: {
                light: { root: { shadow: 'inset 0 -1px 0 0 rgba(0, 0, 0, 0.13)' } },
                dark: { root: { shadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.09)' } }
            }
        }
    }
});

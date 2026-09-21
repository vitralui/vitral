import { definePreset } from '../engine/preset';
import { palette } from '../engine/palette';
import { Base } from './base';

// The plain theme: square corners, grey control fills with a mid-grey
// border, a compact 13px type size, no shadows and no animation. It is the look
// for dense tools and for machines where every millisecond of transition shows.

export const Simple = definePreset(Base, {
    primitive: {
        borderRadius: { none: '0', xs: '0', sm: '0', md: '0', lg: '2px', xl: '2px', pill: '999px' },
        accent: palette('#119eda')
    },
    semantic: {
        fontFamily: "'Segoe UI', 'Noto Sans', Tahoma, system-ui, sans-serif",
        fontSize: '0.8125rem',
        lineHeight: '1.35',
        transitionDuration: '0s',
        disabledOpacity: '0.5',
        primary: palette('{accent}'),
        control: { minHeight: '1.75rem', sm: { minHeight: '1.375rem' }, lg: { minHeight: '2.25rem' } },
        formField: {
            paddingX: '0.375rem',
            paddingY: '0.25rem',
            sm: { fontSize: '0.75rem', paddingX: '0.25rem', paddingY: '0.0625rem' },
            lg: { fontSize: '0.9375rem', paddingX: '0.5rem', paddingY: '0.375rem' }
        },
        focusRing: { width: '1px', style: 'dotted', color: '{text.color}', offset: '2px' },
        iconButton: { borderRadius: '{borderRadius.sm}' },
        list: { padding: '0', gap: '0', option: { padding: '0.25rem 0.5rem' } },
        overlay: {
            select: { shadow: '0 2px 6px rgba(0, 0, 0, 0.2)' },
            popover: { padding: '0.5rem', shadow: '0 2px 6px rgba(0, 0, 0, 0.2)' },
            modal: { padding: '1rem', shadow: '0 8px 24px rgba(0, 0, 0, 0.3)' },
            navigation: { shadow: '0 2px 6px rgba(0, 0, 0, 0.2)' }
        },
        navigation: { list: { padding: '0', gap: '0' }, item: { padding: '0.25rem 0.5rem' } },
        colorScheme: {
            light: {
                surface: { 0: '#ffffff', 50: '#f5f5f5', 100: '#ebebeb', 200: '#dcdcdc', 300: '#aaaaaa', 400: '#888888', 500: '#686868', 600: '#505050', 700: '#3f3f3f', 800: '#333333', 900: '#282828', 950: '#000000' },
                app: { background: '#ffffff' },
                primary: { color: '#086f9e', hoverColor: '#0b86bd', activeColor: '#065a80', borderColor: '#086f9e', hoverBorderColor: '#0b86bd', subtleColor: '#086f9e' },
                highlight: { background: 'color-mix(in srgb, #119eda 28%, transparent)', focusBackground: 'color-mix(in srgb, #119eda 40%, transparent)', color: '#000000', focusColor: '#000000' },
                text: { color: '#000000', hoverColor: '#000000', mutedColor: '#5a5a5a', hoverMutedColor: '#333333' },
                formField: { borderColor: '#929292', hoverBorderColor: '#686868', shadow: 'none', focusShadow: 'none', color: '#000000' },
                content: { borderColor: '#aaaaaa' },
                overlay: { select: { borderColor: '#888888' }, popover: { borderColor: '#888888' }, modal: { borderColor: '#888888' } },
                list: { option: { focusBackground: 'color-mix(in srgb, #119eda 16%, transparent)' } },
                navigation: { item: { focusBackground: 'color-mix(in srgb, #119eda 16%, transparent)', activeBackground: 'color-mix(in srgb, #119eda 28%, transparent)' } },
                secondary: {
                    color: '#f5f5f5',
                    contrastColor: '#000000',
                    hoverColor: '#e2e2e2',
                    activeColor: '#cccccc',
                    borderColor: '#aaaaaa',
                    hoverBorderColor: '#686868',
                    subtleBackground: '#f0f0f0',
                    subtleHoverBackground: '#e2e2e2',
                    subtleColor: '#000000',
                    subtleBorderColor: '#aaaaaa'
                }
            },
            dark: {
                surface: { 0: '#ffffff', 50: '#f0f0f0', 100: '#dedede', 200: '#bbbbbb', 300: '#999999', 400: '#808080', 500: '#686868', 600: '#505050', 700: '#3f3f3f', 800: '#333333', 900: '#282828', 950: '#1e1e1e' },
                app: { background: '#282828' },
                primary: { color: '#3fb4e8', contrastColor: '#000000', hoverColor: '#6cc6ee', activeColor: '#99d8f3', borderColor: '#3fb4e8', hoverBorderColor: '#6cc6ee', subtleColor: '#6cc6ee' },
                highlight: { background: 'color-mix(in srgb, #119eda 35%, transparent)', focusBackground: 'color-mix(in srgb, #119eda 48%, transparent)', color: '#ffffff', focusColor: '#ffffff' },
                text: { color: '#dedede', hoverColor: '#ffffff', mutedColor: '#999999', hoverMutedColor: '#bbbbbb' },
                formField: { background: '#1e1e1e', borderColor: '#6a6a6a', hoverBorderColor: '#808080', shadow: 'none', focusShadow: 'none', color: '#dedede' },
                content: { background: '#282828', borderColor: '#505050' },
                overlay: { select: { background: '#333333', borderColor: '#505050' }, popover: { background: '#333333', borderColor: '#505050' }, modal: { background: '#333333', borderColor: '#505050' } },
                secondary: {
                    color: '#3f3f3f',
                    contrastColor: '#dedede',
                    hoverColor: '#4a4a4a',
                    activeColor: '#555555',
                    borderColor: '#505050',
                    hoverBorderColor: '#808080',
                    subtleBackground: '#333333',
                    subtleHoverBackground: '#3f3f3f',
                    subtleColor: '#dedede',
                    subtleBorderColor: '#505050'
                }
            }
        }
    }
});

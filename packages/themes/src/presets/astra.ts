import { definePreset } from '../engine/preset';
import { Base, severityDark, severityLight } from './base';

// A bright, rounded theme on cool slate: a violet primary, 10px corners on
// fields and larger ones on surfaces, roomy controls, and a violet halo for
// focus. At night the window turns deep navy and the primary lightens, so it
// keeps its glow against the dark.

const slate = {
    0: '#ffffff',
    50: '{slate.50}',
    100: '{slate.100}',
    200: '{slate.200}',
    300: '{slate.300}',
    400: '{slate.400}',
    500: '{slate.500}',
    600: '{slate.600}',
    700: '{slate.700}',
    800: '{slate.800}',
    900: '{slate.900}',
    950: '{slate.950}'
};

export const Astra = definePreset(Base, {
    primitive: {
        borderRadius: { none: '0', xs: '4px', sm: '6px', md: '10px', lg: '14px', xl: '18px', pill: '999px' }
    },
    semantic: {
        fontFamily: "'Plus Jakarta Sans', Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
        fontSize: '0.875rem',
        lineHeight: '1.5',
        transitionDuration: '0.2s',
        primary: {
            50: '{violet.50}',
            100: '{violet.100}',
            200: '{violet.200}',
            300: '{violet.300}',
            400: '{violet.400}',
            500: '{violet.500}',
            600: '{violet.600}',
            700: '{violet.700}',
            800: '{violet.800}',
            900: '{violet.900}',
            950: '{violet.950}'
        },
        control: { minHeight: '2.5rem', sm: { minHeight: '2rem' }, lg: { minHeight: '3rem' } },
        formField: {
            paddingX: '0.875rem',
            paddingY: '0.5625rem',
            borderRadius: '{borderRadius.md}',
            sm: { fontSize: '0.8125rem', paddingX: '0.75rem', paddingY: '0.375rem' },
            lg: { fontSize: '1rem', paddingX: '1rem', paddingY: '0.75rem' }
        },
        // 400 read at 2.72:1 against a white field, under the 3:1 that 1.4.11
        // asks of a focus indicator — and a focus ring is how someone on the
        // keyboard knows where they are. 500 is the same hue, one step down.
        focusRing: { width: '2px', style: 'solid', color: '{primary.500}', offset: '2px' },
        list: {
            padding: '0.375rem',
            gap: '2px',
            option: { padding: '0.5rem 0.75rem', borderRadius: '{borderRadius.sm}' },
            optionGroup: { padding: '0.5rem 0.75rem', fontWeight: '600' }
        },
        content: { borderRadius: '{borderRadius.lg}' },
        overlay: {
            select: { borderRadius: '{borderRadius.md}', shadow: '0 12px 28px -8px rgba(15, 23, 42, 0.22), 0 2px 6px -2px rgba(15, 23, 42, 0.12)' },
            popover: { borderRadius: '{borderRadius.lg}', padding: '1rem', shadow: '0 12px 28px -8px rgba(15, 23, 42, 0.22), 0 2px 6px -2px rgba(15, 23, 42, 0.12)' },
            modal: { borderRadius: '{borderRadius.xl}', padding: '1.5rem', shadow: '0 28px 56px -12px rgba(15, 23, 42, 0.35)' },
            navigation: { shadow: '0 12px 28px -8px rgba(15, 23, 42, 0.22), 0 2px 6px -2px rgba(15, 23, 42, 0.12)' }
        },
        navigation: { item: { padding: '0.5rem 0.75rem', borderRadius: '{borderRadius.sm}' } },
        colorScheme: {
            light: {
                surface: slate,
                primary: { ...severityLight('primary'), subtleColor: '{primary.700}' },
                highlight: { background: '{primary.50}', focusBackground: '{primary.100}', color: '{primary.700}', focusColor: '{primary.800}' },
                app: { background: '{surface.50}' },
                formField: {
                    borderColor: 'color-mix(in srgb, {text.color} 42%, {surface.200})',
                    hoverBorderColor: '{primary.300}',
                    filledBackground: '{surface.100}',
                    focusShadow: '0 0 0 4px color-mix(in srgb, {primary.color} 18%, transparent)'
                },
                list: { option: { selectedIndicator: '{primary.color}' } }
            },
            dark: {
                surface: slate,
                primary: severityDark('primary'),
                app: { background: '#0b1020' },
                content: { background: '{surface.900}', hoverBackground: '{surface.800}', borderColor: 'color-mix(in srgb, {text.color} 6%, {surface.700})' },
                formField: {
                    background: '#0b1020',
                    hoverBackground: '#0b1020',
                    focusBackground: '#0b1020',
                    borderColor: 'color-mix(in srgb, {text.color} 18%, {surface.700})',
                    hoverBorderColor: '{primary.400}',
                    filledBackground: '{surface.800}',
                    focusShadow: '0 0 0 4px color-mix(in srgb, {primary.color} 28%, transparent)'
                },
                overlay: {
                    select: { background: '{surface.900}', borderColor: 'color-mix(in srgb, {text.color} 6%, {surface.700})' },
                    popover: { background: '{surface.900}', borderColor: 'color-mix(in srgb, {text.color} 6%, {surface.700})' },
                    modal: { background: '{surface.900}', borderColor: 'color-mix(in srgb, {text.color} 6%, {surface.700})' }
                },
                list: { option: { selectedIndicator: '{primary.color}' } }
            }
        }
    }
});

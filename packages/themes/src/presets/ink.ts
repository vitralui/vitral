import { definePreset } from '../engine/preset';
import { Base } from './base';

/**
 * A quiet, high-contrast look: zinc surfaces with hairline
 * borders, a primary that is near-black on white and near-white on black, one
 * shadow used sparingly, 6px corners, and a focus ring that sits two pixels
 * off the control with the page colour between them.
 *
 * Colour carries meaning here rather than decoration — the accent is reserved
 * for state (selected, focused, dangerous), which is why the primary button is
 * ink and not a hue.
 */
export const Ink = definePreset(Base, {
    primitive: {
        borderRadius: { none: '0', xs: '2px', sm: '4px', md: '6px', lg: '8px', xl: '12px', pill: '999px' }
    },
    semantic: {
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        fontSize: '0.875rem',
        lineHeight: '1.43',
        transitionDuration: '0.15s',
        disabledOpacity: '0.5',
        control: { minHeight: '2.25rem', sm: { minHeight: '2rem' }, lg: { minHeight: '2.5rem' } },
        formField: {
            paddingX: '0.75rem',
            paddingY: '0.5rem',
            borderRadius: '{borderRadius.md}',
            sm: { fontSize: '0.8125rem', paddingX: '0.625rem', paddingY: '0.375rem' },
            lg: { fontSize: '1rem', paddingX: '0.875rem', paddingY: '0.625rem' }
        },
        // Two pixels of page colour, then two of ink: the ring reads on any
        // background without touching the control's own border.
        focusRing: { width: '2px', style: 'solid', color: '{primary.color}', offset: '2px' },
        list: {
            padding: '0.25rem',
            gap: '2px',
            option: { padding: '0.375rem 0.5rem', borderRadius: '{borderRadius.sm}' },
            optionGroup: { padding: '0.375rem 0.5rem', fontWeight: '600' }
        },
        content: { borderRadius: '{borderRadius.lg}' },
        overlay: {
            select: { borderRadius: '{borderRadius.md}', shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)' },
            popover: { borderRadius: '{borderRadius.lg}', padding: '1rem', shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)' },
            modal: { borderRadius: '{borderRadius.lg}', padding: '1.5rem', shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' },
            navigation: { shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)' }
        },
        navigation: { item: { padding: '0.375rem 0.5rem', borderRadius: '{borderRadius.sm}' } },
        colorScheme: {
            light: {
                app: { background: '{surface.0}' },
                primary: {
                    color: '{surface.900}',
                    contrastColor: '{surface.50}',
                    hoverColor: '{surface.800}',
                    activeColor: '{surface.700}',
                    borderColor: '{surface.900}',
                    hoverBorderColor: '{surface.800}',
                    subtleBackground: '{surface.100}',
                    subtleHoverBackground: '{surface.200}',
                    subtleColor: '{surface.900}',
                    subtleBorderColor: '{surface.200}'
                },
                highlight: { background: '{surface.100}', focusBackground: '{surface.200}', color: '{surface.900}', focusColor: '{surface.950}' },
                content: { background: '{surface.0}', hoverBackground: '{surface.50}', borderColor: '{surface.200}' },
                formField: {
                    borderColor: '{surface.200}',
                    hoverBorderColor: '{surface.300}',
                    focusBorderColor: '{surface.200}',
                    filledBackground: '{surface.100}',
                    shadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    focusShadow: '0 0 0 2px {app.background}, 0 0 0 4px {primary.color}'
                },
                secondary: {
                    color: '{surface.100}',
                    contrastColor: '{surface.900}',
                    hoverColor: '{surface.200}',
                    activeColor: '{surface.300}',
                    borderColor: '{surface.200}',
                    hoverBorderColor: '{surface.300}',
                    subtleBackground: '{surface.100}',
                    subtleHoverBackground: '{surface.200}',
                    subtleColor: '{surface.900}',
                    subtleBorderColor: '{surface.200}'
                },
                list: { option: { focusBackground: '{surface.100}', selectedBackground: '{surface.100}', selectedFocusBackground: '{surface.200}' } }
            },
            dark: {
                app: { background: '{surface.950}' },
                primary: {
                    color: '{surface.50}',
                    contrastColor: '{surface.900}',
                    hoverColor: '{surface.200}',
                    activeColor: '{surface.300}',
                    borderColor: '{surface.50}',
                    hoverBorderColor: '{surface.200}',
                    subtleBackground: '{surface.800}',
                    subtleHoverBackground: '{surface.700}',
                    subtleColor: '{surface.50}',
                    subtleBorderColor: '{surface.700}'
                },
                highlight: { background: '{surface.800}', focusBackground: '{surface.700}', color: '{surface.50}', focusColor: '{surface.0}' },
                content: { background: '{surface.950}', hoverBackground: '{surface.900}', borderColor: '{surface.800}' },
                formField: {
                    background: '{surface.950}',
                    borderColor: '{surface.800}',
                    hoverBorderColor: '{surface.700}',
                    focusBorderColor: '{surface.800}',
                    filledBackground: '{surface.900}',
                    shadow: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
                    focusShadow: '0 0 0 2px {app.background}, 0 0 0 4px {primary.color}'
                },
                secondary: {
                    color: '{surface.800}',
                    contrastColor: '{surface.50}',
                    hoverColor: '{surface.700}',
                    activeColor: '{surface.600}',
                    borderColor: '{surface.800}',
                    hoverBorderColor: '{surface.700}',
                    subtleBackground: '{surface.800}',
                    subtleHoverBackground: '{surface.700}',
                    subtleColor: '{surface.50}',
                    subtleBorderColor: '{surface.700}'
                },
                list: { option: { focusBackground: '{surface.800}', selectedBackground: '{surface.800}', selectedFocusBackground: '{surface.700}' } }
            }
        }
    }
});

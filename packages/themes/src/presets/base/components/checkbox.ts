// The checkbox: a 20px box with a strong stroke over a faint fill,
// accent-filled with a light glyph once checked. The stroke is the muted text
// colour rather than the field border, which in some presets is too faint to show
// where a box is.
export default {
    root: {
        size: '1.25rem',
        gap: '0.5rem',
        borderRadius: '{borderRadius.sm}',
        borderWidth: '1px',
        iconSize: '0.875rem',
        background: '{formField.filledBackground}',
        hoverBackground: '{formField.filledHoverBackground}',
        borderColor: '{text.mutedColor}',
        hoverBorderColor: '{text.hoverMutedColor}',
        checkedBackground: '{primary.color}',
        checkedHoverBackground: '{primary.hoverColor}',
        checkedBorderColor: '{primary.color}',
        checkedHoverBorderColor: '{primary.hoverColor}',
        iconColor: '{primary.contrastColor}',
        invalidBorderColor: '{formField.invalidBorderColor}',
        labelColor: '{text.color}',
        transitionDuration: '{transitionDuration}',
        sm: { size: '1rem', iconSize: '0.75rem', fontSize: '{formField.sm.fontSize}' },
        lg: { size: '1.5rem', iconSize: '1.125rem', fontSize: '{formField.lg.fontSize}' }
    }
};

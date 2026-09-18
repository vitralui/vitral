// The radio button: a 20px ring with a strong stroke; checked, it fills
// with the accent and shows a light dot that grows under the pointer and
// shrinks while pressed.
export default {
    root: {
        size: '1.25rem',
        gap: '0.5rem',
        borderWidth: '1px',
        background: '{formField.filledBackground}',
        hoverBackground: '{formField.filledHoverBackground}',
        borderColor: '{text.mutedColor}',
        hoverBorderColor: '{text.hoverMutedColor}',
        checkedBackground: '{primary.color}',
        checkedHoverBackground: '{primary.hoverColor}',
        checkedBorderColor: '{primary.color}',
        invalidBorderColor: '{formField.invalidBorderColor}',
        dotColor: '{primary.contrastColor}',
        dotSize: '0.625rem',
        dotHoverSize: '0.75rem',
        dotActiveSize: '0.5rem',
        labelColor: '{text.color}',
        transitionDuration: '{transitionDuration}',
        sm: { size: '1rem', dotSize: '0.5rem', dotHoverSize: '0.625rem', dotActiveSize: '0.375rem', fontSize: '{formField.sm.fontSize}' },
        lg: { size: '1.5rem', dotSize: '0.75rem', dotHoverSize: '0.875rem', dotActiveSize: '0.625rem', fontSize: '{formField.lg.fontSize}' }
    }
};

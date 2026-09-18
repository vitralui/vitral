// A segmented control: buttons welded into one, of which one — or several — is
// pressed. Sized by the control scale, like every other field.
export default {
    root: {
        borderRadius: '{formField.borderRadius}',
        borderColor: '{formField.borderColor}',
        invalidBorderColor: '{formField.invalidBorderColor}'
    },
    item: {
        paddingX: '0.875rem',
        paddingY: '0.375rem',
        fontWeight: '500',
        background: '{formField.background}',
        hoverBackground: '{content.hoverBackground}',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        checkedBackground: '{primary.color}',
        checkedColor: '{primary.contrastColor}',
        checkedHoverBackground: '{primary.hoverColor}',
        sm: { paddingX: '0.625rem', paddingY: '0.1875rem', fontSize: '0.8125rem' },
        lg: { paddingX: '1.125rem', paddingY: '0.5rem', fontSize: '1rem' }
    },
    icon: { size: '1rem' }
};

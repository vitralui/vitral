// A key on a keyboard: a small raised cap, the bottom edge a little heavier so
// it reads as something pressed rather than as a badge.
export default {
    root: {
        gap: '0.25rem',
        separatorColor: '{text.mutedColor}'
    },
    key: {
        fontFamily: '{fontFamily}',
        fontSize: '0.75rem',
        fontWeight: '500',
        lineHeight: '1',
        minWidth: '1.375rem',
        height: '1.375rem',
        paddingX: '0.375rem',
        borderWidth: '1px',
        bottomWidth: '2px',
        borderRadius: '{borderRadius.sm}',
        colorScheme: {
            light: { background: '{surface.50}', borderColor: '{surface.300}', color: '{text.color}' },
            dark: { background: '{surface.800}', borderColor: '{surface.600}', color: '{text.color}' }
        }
    },
    sm: {
        fontSize: '0.6875rem',
        minWidth: '1.125rem',
        height: '1.125rem',
        paddingX: '0.25rem'
    },
    lg: {
        fontSize: '0.875rem',
        minWidth: '1.75rem',
        height: '1.75rem',
        paddingX: '0.5rem'
    }
};

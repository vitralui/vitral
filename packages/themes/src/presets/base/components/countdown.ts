// Time left, in tiles: large figures that do not jump as they change, and
// the unit under each.
export default {
    root: {
        gap: '0.5rem'
    },
    tile: {
        minWidth: '3.5rem',
        padding: '0.5rem 0.5rem 0.375rem',
        background: '{content.hoverBackground}',
        borderRadius: '{borderRadius.md}'
    },
    value: {
        fontSize: '1.75rem',
        fontWeight: '600',
        color: '{text.hoverColor}'
    },
    label: {
        fontSize: '0.6875rem',
        color: '{text.mutedColor}'
    },
    separator: {
        color: '{text.mutedColor}'
    }
};

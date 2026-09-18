// The breadcrumb trail: the trail in the secondary text colour, the current
// page in the primary one, chevrons between.
export default {
    root: {
        padding: '0',
        background: 'transparent',
        gap: '0.25rem'
    },
    item: {
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        hoverBackground: '{content.hoverBackground}',
        padding: '0.125rem 0.375rem',
        borderRadius: '{borderRadius.sm}',
        gap: '0.375rem',
        icon: {
            color: '{text.mutedColor}',
            hoverColor: '{text.color}'
        }
    },
    current: {
        color: '{text.color}',
        fontWeight: '600'
    },
    separator: {
        color: '{text.mutedColor}'
    }
};

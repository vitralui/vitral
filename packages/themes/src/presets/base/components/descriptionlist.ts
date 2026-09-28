// Facts about one thing, as label and value: an order's details, a profile.
export default {
    root: {
        gap: '0.75rem'
    },
    header: {
        gap: '0.5rem'
    },
    title: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '{text.hoverColor}'
    },
    list: {
        columnGap: '1.5rem',
        rowGap: '0.875rem'
    },
    item: {
        gap: '0.25rem',
        padding: '0.75rem 1rem',
        borderColor: '{content.borderColor}',
        borderRadius: '{content.borderRadius}',
        stripedBackground: '{content.hoverBackground}'
    },
    label: {
        fontSize: '0.8125rem',
        fontWeight: '500',
        color: '{text.mutedColor}',
        width: '10rem'
    },
    value: {
        color: '{text.color}'
    }
};

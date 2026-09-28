// A page's outline down the side: quiet links, the one being read in the
// accent, with a bar along the rule beside it.
export default {
    root: {
        gap: '0.125rem',
        fontSize: '0.8125rem',
        borderColor: '{content.borderColor}'
    },
    title: {
        fontSize: '0.75rem',
        fontWeight: '600',
        color: '{text.hoverColor}',
        marginBottom: '0.5rem'
    },
    link: {
        padding: '0.25rem 0.75rem',
        indent: '0.75rem',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        activeColor: '{primary.color}',
        activeBorderColor: '{primary.color}',
        borderRadius: '{borderRadius.sm}'
    }
};

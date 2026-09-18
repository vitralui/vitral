// The tab strip: quiet text items, a hover fill, and the selected one
// marked by a short accent pill that slides to it. A preset that wants a
// full-width underline sets `indicator.width` to `100%`.
export default {
    tablist: {
        gap: '0.25rem',
        padding: '0',
        borderWidth: '0',
        borderColor: '{content.borderColor}'
    },
    tab: {
        padding: '0.4375rem 0.75rem',
        fontWeight: '400',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        activeColor: '{text.hoverColor}',
        background: 'transparent',
        hoverBackground: '{content.hoverBackground}',
        activeBackground: 'transparent',
        borderRadius: '{borderRadius.sm}'
    },
    indicator: {
        color: '{primary.color}',
        width: '1rem',
        thickness: '3px',
        borderRadius: '{borderRadius.pill}',
        duration: '0.25s'
    },
    tabpanel: {
        padding: '1rem 0',
        verticalPadding: '0 1rem',
        color: '{content.color}'
    }
};

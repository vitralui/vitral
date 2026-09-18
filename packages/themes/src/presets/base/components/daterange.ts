// Two dates and the days between them. The band behind the span is the
// highlight colour at low strength, so the two ends stay the loudest thing in
// the calendar and the days between read as included rather than as chosen.
export default {
    root: {
        padding: '0.75rem',
        borderRadius: '{content.borderRadius}',
        background: '{overlay.popover.background}',
        monthGap: '1.25rem'
    },
    title: {
        fontSize: '0.875rem',
        fontWeight: '600'
    },
    weekday: {
        fontSize: '0.75rem',
        fontWeight: '500',
        color: '{text.mutedColor}'
    },
    day: {
        size: '2rem',
        fontSize: '0.8125rem',
        borderRadius: '{borderRadius.md}',
        color: '{text.color}',
        hoverBackground: '{navigation.item.focusBackground}'
    },
    band: {
        background: '{highlight.background}'
    },
    preview: {
        background: '{navigation.item.focusBackground}'
    },
    end: {
        background: '{primary.color}',
        color: '{primary.contrastColor}'
    },
    today: {
        borderColor: '{primary.color}'
    },
    otherMonth: {
        color: '{text.mutedColor}'
    }
};

// A scheduler on the content surface: hairline slots, shaded hours outside
// business time, events tinted from their own colour with an accent edge, and
// a line in the danger colour at the current time.
export default {
    root: {
        gap: '0.75rem',
        fontSize: '{fontSize}',
        color: '{text.color}',
        transitionDuration: '{transitionDuration}'
    },
    toolbar: {
        gap: '0.5rem',
        titleFontSize: '1.125rem',
        titleFontWeight: '600'
    },
    grid: {
        background: '{content.background}',
        borderColor: '{content.borderColor}',
        borderRadius: '{content.borderRadius}'
    },
    header: {
        padding: '0.5rem 0.25rem',
        fontSize: '0.8125rem',
        fontWeight: '600',
        color: '{text.mutedColor}',
        todayColor: '{primary.color}'
    },
    gutter: {
        width: '4.5rem',
        padding: '0 0.5rem',
        fontSize: '0.75rem',
        color: '{text.mutedColor}'
    },
    slot: {
        height: '1.75rem',
        borderColor: 'color-mix(in srgb, {content.borderColor} 55%, transparent)',
        hourBorderColor: '{content.borderColor}',
        hoverBackground: 'color-mix(in srgb, {primary.color} 5%, transparent)',
        selectedBackground: 'color-mix(in srgb, {primary.color} 16%, transparent)',
        todayBackground: 'color-mix(in srgb, {primary.color} 3%, transparent)',
        weekendBackground: 'transparent'
    },
    allDay: {
        paddingY: '0.25rem'
    },
    event: {
        height: '1.375rem',
        gap: '2px',
        padding: '0.125rem 0.375rem',
        borderRadius: '{borderRadius.sm}',
        fontSize: '0.75rem',
        fontWeight: '500',
        timeFontWeight: '400',
        accentWidth: '3px',
        tint: '16%',
        color: '{text.color}',
        hoverShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.15)',
        draggingShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.3)',
        draggingOpacity: '0.9',
        resizerSize: '6px',
        listPadding: '0.5rem 0.75rem'
    },
    month: {
        dateHeight: '1.75rem',
        dateSize: '1.5rem',
        dateFontSize: '0.8125rem',
        dateColor: '{text.color}',
        todayDateBackground: '{primary.color}',
        todayDateColor: '{primary.contrastColor}',
        otherMonthColor: '{text.mutedColor}',
        cellPadding: '0.25rem',
        moreColor: '{text.mutedColor}',
        moreHoverColor: '{text.color}',
        moreHoverBackground: '{content.hoverBackground}'
    },
    now: {
        color: '{danger.color}',
        width: '2px',
        dotSize: '0.5rem'
    },
    timeline: {
        resourceWidth: '10rem',
        slotWidth: '4.5rem',
        rowPadding: '0.375rem',
        resourceFontWeight: '500'
    },
    agenda: {
        gap: '1rem',
        dateFontWeight: '600',
        dateColor: '{text.color}',
        dateTodayColor: '{primary.color}',
        itemGap: '0.25rem',
        emptyPadding: '2rem',
        emptyColor: '{text.mutedColor}'
    },
    more: {
        width: '16rem',
        gap: '0.25rem',
        titleFontWeight: '600'
    },
    colorScheme: {
        light: {
            slot: { nonBusinessBackground: '{surface.50}' },
            event: { base: '{surface.0}' }
        },
        dark: {
            slot: { nonBusinessBackground: 'color-mix(in srgb, {surface.950} 45%, transparent)' },
            event: { base: '{surface.900}', tint: '26%' }
        }
    }
};
